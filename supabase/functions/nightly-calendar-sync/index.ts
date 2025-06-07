import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { syncUserCalendarDataWithRange } from '../_shared/google-calendar-service.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SyncResult {
  userId: string;
  calendarResult?: {
    eventsProcessed: number;
    artifactsCreated: number;
    contactsUpdated: string[];
    syncLogId: string;
  };
  emailResult?: {
    contactsProcessed: number;
    emailsProcessed: number;
    emailArtifactsCreated: number;
  };
  error?: string;
}

serve(async (req) => {
  try {
    console.log('🌙 Starting nightly sync...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get all users with calendar integrations
    const { data: users, error: usersError } = await supabase
      .from('user_integrations')
      .select(`
        user_id,
        calendar_data,
        gmail_data
      `)
      .not('calendar_data', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📅 Found ${users.length} users with integrations`);
    
    const results: SyncResult[] = [];
    
    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.user_id}`);
      
      const result: SyncResult = { userId: user.user_id };
      
      try {
        // Calendar sync (existing logic)
        if (user.calendar_data) {
          console.log(`📅 Syncing calendar for user ${user.user_id}`);
          result.calendarResult = await syncUserCalendarDataWithRange(
            user.user_id,
            supabase,
            {
              lookbackDays: 7,    // Look back 7 days
              lookforwardDays: 30, // Look forward 30 days
            }
          );
          console.log(`📅 Calendar sync completed: ${result.calendarResult.eventsProcessed} events processed, ${result.calendarResult.artifactsCreated} artifacts created`);
        }

        // Email sync (new logic)
        if (user.gmail_data) {
          console.log(`📧 Syncing emails for user ${user.user_id}`);
          result.emailResult = await syncUserEmailsForNightlyJob(user.user_id, supabase);
          console.log(`📧 Email sync completed: ${result.emailResult.contactsProcessed} contacts processed, ${result.emailResult.emailsProcessed} emails processed`);
        }
        
      } catch (error) {
        console.error(`❌ Error syncing for user ${user.user_id}:`, error);
        result.error = error.message;
      }
      
      results.push(result);
    }

    const successfulCalendarSyncs = results.filter(r => r.calendarResult && !r.error).length;
    const successfulEmailSyncs = results.filter(r => r.emailResult && !r.error).length;
    const totalErrors = results.filter(r => r.error).length;

    console.log(`\n✅ Nightly sync completed:`);
    console.log(`📅 Calendar: ${successfulCalendarSyncs}/${users.length} users synced successfully`);
    console.log(`📧 Email: ${successfulEmailSyncs}/${users.length} users synced successfully`);
    console.log(`❌ Errors: ${totalErrors}`);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        usersProcessed: users.length,
        calendarSyncsSuccessful: successfulCalendarSyncs,
        emailSyncsSuccessful: successfulEmailSyncs,
        errors: totalErrors
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Nightly sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Sync emails for all contacts for a user (nightly job)
 */
async function syncUserEmailsForNightlyJob(
  userId: string, 
  supabase: any
): Promise<{
  contactsProcessed: number;
  emailsProcessed: number;
  emailArtifactsCreated: number;
}> {
  // Get all contacts for this user that have email addresses
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select(`
      id,
      name,
      email,
      contact_emails (
        email,
        email_type,
        is_primary
      )
    `)
    .eq('user_id', userId);

  if (contactsError) {
    throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
  }

  // Filter contacts that have at least one email
  const contactsWithEmails = contacts.filter(contact => {
    const hasEmail = contact.email || (contact.contact_emails && contact.contact_emails.length > 0);
    return hasEmail;
  });

  console.log(`📧 Found ${contactsWithEmails.length} contacts with email addresses`);

  let totalEmailsProcessed = 0;
  let totalArtifactsCreated = 0;

  // Sync emails for each contact (last 7 days)
  for (const contact of contactsWithEmails) {
    try {
      // Build email addresses array
      const emailAddresses = [];
      
      if (contact.email) {
        emailAddresses.push(contact.email);
      }
      
      if (contact.contact_emails) {
        emailAddresses.push(...contact.contact_emails.map((ce: any) => ce.email));
      }

      // Remove duplicates
      const uniqueEmails = [...new Set(emailAddresses)];

      // Calculate date range (7 days back)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      // Call the email sync endpoint
      const response = await fetch(`${supabaseUrl}/functions/v1/gmail-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          contact_id: contact.id,
          user_id: userId,
          email_addresses: uniqueEmails,
          date_range: {
            start: sevenDaysAgo.toISOString(),
            end: today.toISOString(),
          },
          max_results: 50, // Smaller limit for nightly sync
        }),
      });

      if (response.ok) {
        const result = await response.json();
        totalEmailsProcessed += result.progress?.processed_emails || 0;
        totalArtifactsCreated += result.progress?.created_artifacts || 0;
        console.log(`📧 Synced ${result.progress?.processed_emails || 0} emails for ${contact.name}`);
      } else {
        console.warn(`📧 Failed to sync emails for contact ${contact.name}: ${response.statusText}`);
      }

    } catch (error) {
      console.warn(`📧 Error syncing emails for contact ${contact.name}:`, error);
    }
  }

  return {
    contactsProcessed: contactsWithEmails.length,
    emailsProcessed: totalEmailsProcessed,
    emailArtifactsCreated: totalArtifactsCreated,
  };
} 