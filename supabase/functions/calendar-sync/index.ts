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

// Predefined sync modes with their configurations
const SYNC_MODES = {
  nightly: {
    lookbackDays: 7,
    lookforwardDays: 30,
    description: 'Regular maintenance sync'
  },
  onboarding: {
    lookbackDays: 365, // 12 months back
    lookforwardDays: 90, // 3 months forward
    description: 'Comprehensive onboarding sync'
  },
  manual: {
    lookbackDays: 30,
    lookforwardDays: 60,
    description: 'Manual user-triggered sync'
  },
  historical: {
    lookbackDays: 730, // 2 years back
    lookforwardDays: 30,
    description: 'Deep historical analysis'
  }
};

serve(async (req) => {
  try {
    console.log('📅 Starting calendar sync...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Parse request body to get sync parameters
    let requestBody: any = {};
    try {
      if (req.method === 'POST') {
        requestBody = await req.json();
      }
    } catch (error) {
      console.log('No request body or invalid JSON, using nightly defaults');
    }

    // Determine sync mode and configuration
    const mode = requestBody.mode || 'nightly';
    const modeConfig = SYNC_MODES[mode as keyof typeof SYNC_MODES] || SYNC_MODES.nightly;
    
    // Allow overrides of the mode defaults
    const lookbackDays = requestBody.lookbackDays || modeConfig.lookbackDays;
    const lookforwardDays = requestBody.lookforwardDays || modeConfig.lookforwardDays;
    const specificUserId = requestBody.user_id; // Optional: sync specific user only
    
    console.log(`📅 Sync mode: ${mode} (${modeConfig.description})`);
    console.log(`📅 Configuration: ${lookbackDays} days back, ${lookforwardDays} days forward`);
    if (specificUserId) {
      console.log(`🎯 Targeting specific user: ${specificUserId}`);
    }
    
    // Get all users with calendar integrations (or specific user if provided)
    let query = supabase
      .from('user_integrations')
      .select(`
        user_id,
        integration_type,
        access_token,
        refresh_token,
        token_expires_at,
        scopes,
        metadata
      `)
      .eq('integration_type', 'google_calendar');

    if (specificUserId) {
      query = query.eq('user_id', specificUserId);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📅 Found ${users.length} users with calendar integrations`);
    
    const results: SyncResult[] = [];
    
    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.user_id}`);
      
      const result: SyncResult = { userId: user.user_id };
      
      try {
        // Calendar sync with mode-based configuration
        console.log(`📅 Syncing calendar for user ${user.user_id} (${mode} mode: ${lookbackDays} days back, ${lookforwardDays} days forward)`);
        result.calendarResult = await syncUserCalendarDataWithRange(
          user.user_id,
          supabase,
          {
            lookbackDays,
            lookforwardDays,
          }
        );
        console.log(`📅 Calendar sync completed: ${result.calendarResult.eventsProcessed} events processed, ${result.calendarResult.artifactsCreated} artifacts created`);

        // Email sync is handled separately via gmail-sync function
        // Only keep this logic if we want to include it in the nightly run
        
      } catch (error) {
        console.error(`❌ Error syncing for user ${user.user_id}:`, error);
        result.error = error.message;
      }
      
      results.push(result);
    }

    const successfulCalendarSyncs = results.filter(r => r.calendarResult && !r.error).length;
    const successfulEmailSyncs = results.filter(r => r.emailResult && !r.error).length;
    const totalErrors = results.filter(r => r.error).length;

    console.log(`\n✅ Calendar sync completed (${mode} mode):`);
    console.log(`📅 Calendar: ${successfulCalendarSyncs}/${users.length} users synced successfully`);
    if (mode === 'nightly') {
      console.log(`📧 Email: ${successfulEmailSyncs}/${users.length} users synced successfully`);
    }
    console.log(`❌ Errors: ${totalErrors}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Calendar sync completed (${mode} mode): ${successfulCalendarSyncs} successful, ${totalErrors} errors, ${users.length - successfulCalendarSyncs - totalErrors} skipped`,
      summary: {
        totalUsers: users.length,
        successCount: successfulCalendarSyncs,
        errorCount: totalErrors,
        skippedCount: users.length - successfulCalendarSyncs - totalErrors,
        processingTimeMs: 0
      },
      details: results.map(r => ({
        userId: r.userId,
        status: r.error ? 'error' : 'success',
        eventsProcessed: r.calendarResult?.eventsProcessed || 0,
        artifactsCreated: r.calendarResult?.artifactsCreated || 0,
        message: r.error || `Synced ${r.calendarResult?.eventsProcessed || 0} events, created ${r.calendarResult?.artifactsCreated || 0} artifacts`
      })),
      errors: results.filter(r => r.error).map(r => ({
        userId: r.userId,
        error: r.error
      })),
      timestamp: new Date().toISOString(),
      config: {
        mode,
        description: modeConfig.description,
        lookbackDays,
        lookforwardDays,
        batchSize: 10,
        delayBetweenUsers: 1000,
        delayBetweenBatches: 2000
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Calendar sync failed:', error);
    
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
 * Sync emails for all contacts for a user (nightly job only)
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