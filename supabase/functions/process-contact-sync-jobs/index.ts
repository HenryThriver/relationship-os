import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { GoogleCalendarService, UserIntegration } from '../_shared/google-calendar-service.ts';

interface ContactSyncJob {
  id: string;
  contact_id: string;
  user_id: string;
  sync_options: {
    lookbackDays: number;
    lookforwardDays: number;
    trigger: string;
    newEmail?: string;
  };
  metadata: {
    triggered_by_email_id?: string;
    email_address?: string;
    email_type?: string;
    is_primary?: boolean;
    triggered_at?: string;
  };
  created_at: string;
  contacts: {
    id: string;
    name: string;
    email?: string;
    contact_emails: Array<{
      email: string;
      email_type: string;
      is_primary: boolean;
    }>;
  };
}

serve(async (req) => {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify this is called by cron or admin
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.includes('Bearer')) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('🔄 Processing contact-specific sync jobs...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get pending sync jobs (limit to prevent timeout)
    console.log('📋 Fetching pending sync jobs...');
    const { data: jobs, error: jobsError } = await supabase
      .from('contact_specific_sync_jobs')
      .select(`
        *,
        contacts!inner (
          id,
          name,
          email,
          contact_emails (
            email,
            email_type,
            is_primary
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20); // Process max 20 jobs per run to avoid timeouts

    if (jobsError) {
      throw new Error(`Failed to fetch sync jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('ℹ️ No pending sync jobs found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending sync jobs',
        jobsProcessed: 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Found ${jobs.length} pending sync jobs`);

    let successCount = 0;
    let errorCount = 0;
    const processedJobs: Array<{
      jobId: string;
      contactId: string;
      contactName: string;
      status: 'success' | 'error';
      eventsProcessed?: number;
      artifactsCreated?: number;
      message?: string;
    }> = [];

    // Process each job sequentially to avoid overwhelming the Google Calendar API
    for (const job of jobs as ContactSyncJob[]) {
      try {
        console.log(`🔄 Processing job ${job.id} for contact ${job.contacts.name} (${job.contact_id})`);

        // Mark job as processing
        await supabase
          .from('contact_specific_sync_jobs')
          .update({ 
            status: 'processing',
            processed_at: new Date().toISOString() 
          })
          .eq('id', job.id);

        // Get user's Google Calendar integration
        const { data: integration, error: integrationError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', job.user_id)
          .eq('integration_type', 'google_calendar')
          .single();

        if (integrationError || !integration?.access_token) {
          throw new Error('No Google Calendar integration found for user');
        }

        // Process the sync for this specific contact
        const syncResults = await processContactSpecificSync(
          job,
          integration as UserIntegration,
          supabase
        );

        console.log(`✅ Job ${job.id} completed:`, {
          events: syncResults.eventsProcessed,
          artifacts: syncResults.artifactsCreated
        });

        // Mark job as completed
        await supabase
          .from('contact_specific_sync_jobs')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            metadata: {
              ...job.metadata,
              sync_results: {
                eventsProcessed: syncResults.eventsProcessed,
                artifactsCreated: syncResults.artifactsCreated,
                completedAt: new Date().toISOString()
              }
            }
          })
          .eq('id', job.id);

        successCount++;
        processedJobs.push({
          jobId: job.id,
          contactId: job.contact_id,
          contactName: job.contacts.name,
          status: 'success',
          eventsProcessed: syncResults.eventsProcessed,
          artifactsCreated: syncResults.artifactsCreated,
          message: `Synced ${syncResults.eventsProcessed} events, created ${syncResults.artifactsCreated} artifacts`
        });

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error);

        // Mark job as failed
        await supabase
          .from('contact_specific_sync_jobs')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id);

        errorCount++;
        processedJobs.push({
          jobId: job.id,
          contactId: job.contact_id,
          contactName: job.contacts.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Small delay between jobs to be gentle on the Google Calendar API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const result = {
      success: true,
      message: `Processed ${jobs.length} sync jobs: ${successCount} successful, ${errorCount} failed`,
      summary: {
        totalJobs: jobs.length,
        successCount,
        errorCount
      },
      jobs: processedJobs,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Contact sync job processing summary:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Contact sync job processing failed:', error);
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Process contact-specific calendar sync
 */
async function processContactSpecificSync(
  job: ContactSyncJob,
  integration: UserIntegration,
  supabase: any
): Promise<{
  eventsProcessed: number;
  artifactsCreated: number;
}> {
  const options = job.sync_options;
  const contact = job.contacts;

  // Calculate date range for the sync
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.lookbackDays);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + options.lookforwardDays);

  console.log(`📅 Syncing calendar for contact ${contact.name} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  const calendarService = new GoogleCalendarService(supabase);

  // Fetch meetings in the specified date range
  const events = await calendarService.fetchMeetings(integration, {
    startDate,
    endDate,
    maxResults: 500, // Higher limit for contact-specific syncs
    includeDeclined: false,
    singleEvents: true,
  });

  console.log(`📅 Found ${events.length} total events in date range`);

  // Get all emails for this contact
  const contactEmails = [
    ...(contact.email ? [contact.email] : []),
    ...(contact.contact_emails?.map(ce => ce.email) || [])
  ].map(email => email.toLowerCase());

  console.log(`📧 Contact emails to match: ${contactEmails.join(', ')}`);

  // Filter events that include any of this contact's emails
  const relevantEvents = events.filter(event => 
    event.attendees?.some(attendee => 
      contactEmails.includes(attendee.email.toLowerCase())
    )
  );

  console.log(`🎯 Found ${relevantEvents.length} relevant events for contact ${contact.name}`);

  if (relevantEvents.length === 0) {
    return {
      eventsProcessed: events.length,
      artifactsCreated: 0
    };
  }

  // Create meeting artifacts for relevant events
  const eventToContactsMap = new Map();
  relevantEvents.forEach(event => {
    const matchedEmails = contactEmails.filter(email =>
      event.attendees?.some(attendee => 
        attendee.email.toLowerCase() === email
      )
    );

    eventToContactsMap.set(event.id, [{
      contactId: contact.id,
      contact: contact,
      matchedEmails: matchedEmails,
      confidence: 1.0 // Exact email match
    }]);
  });

  const { created } = await calendarService.createMeetingArtifacts(
    eventToContactsMap,
    relevantEvents,
    job.user_id
  );

  console.log(`📝 Created ${created} new meeting artifacts for contact ${contact.name}`);

  return {
    eventsProcessed: events.length,
    artifactsCreated: created
  };
} 