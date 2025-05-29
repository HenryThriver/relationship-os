import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { syncUserCalendarDataWithRange, UserIntegration } from '../_shared/google-calendar-service.ts';

interface NightlySyncConfig {
  lookbackDays: number;
  lookforwardDays: number;
  batchSize: number;
  delayBetweenUsers: number; // ms
  delayBetweenBatches: number; // ms
}

const DEFAULT_CONFIG: NightlySyncConfig = {
  lookbackDays: 7,        // Look back 7 days for changes
  lookforwardDays: 30,    // Look forward 30 days for upcoming meetings
  batchSize: 10,          // Process 10 users at a time
  delayBetweenUsers: 1000, // 1 second delay between users
  delayBetweenBatches: 2000 // 2 second delay between batches
};

serve(async (req) => {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify this is called by cron or admin (optional auth check)
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.includes('Bearer')) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('🌙 Starting nightly calendar sync...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all users with active Google Calendar integrations
    console.log('📋 Fetching users with Google Calendar integrations...');
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('user_id, id, access_token, refresh_token, token_expires_at, metadata')
      .eq('integration_type', 'google_calendar')
      .not('access_token', 'is', null);

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No users with Google Calendar integration found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No users to sync',
        usersProcessed: 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`👥 Found ${integrations.length} users with calendar integration`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const syncDetails: Array<{
      userId: string;
      status: 'success' | 'error' | 'skipped';
      eventsProcessed?: number;
      artifactsCreated?: number;
      message?: string;
    }> = [];

    // Process users in batches
    for (let i = 0; i < integrations.length; i += DEFAULT_CONFIG.batchSize) {
      const batch = integrations.slice(i, i + DEFAULT_CONFIG.batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / DEFAULT_CONFIG.batchSize) + 1}/${Math.ceil(integrations.length / DEFAULT_CONFIG.batchSize)} (${batch.length} users)`);
      
      await Promise.all(
        batch.map(async (integration, batchIndex) => {
          try {
            // Add delay to avoid rate limiting
            if (batchIndex > 0) {
              await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.delayBetweenUsers));
            }

            console.log(`🔄 Processing user: ${integration.user_id}`);

            // Check if token needs refresh
            const needsRefresh = integration.token_expires_at && 
              new Date(integration.token_expires_at) <= new Date(Date.now() + 5 * 60 * 1000); // 5 min buffer

            if (needsRefresh && !integration.refresh_token) {
              console.warn(`⚠️ User ${integration.user_id} needs token refresh but no refresh token available`);
              skippedCount++;
              syncDetails.push({
                userId: integration.user_id,
                status: 'skipped',
                message: 'Token expired, no refresh token'
              });
              errors.push(`User ${integration.user_id}: Token expired, no refresh token`);
              return;
            }

            // Perform the sync with date range
            const syncResults = await syncUserCalendarDataWithRange(
              integration.user_id,
              supabase,
              {
                lookbackDays: DEFAULT_CONFIG.lookbackDays,
                lookforwardDays: DEFAULT_CONFIG.lookforwardDays,
                integration: integration as UserIntegration
              }
            );

            console.log(`✅ User ${integration.user_id} sync completed:`, {
              events: syncResults.eventsProcessed,
              artifacts: syncResults.artifactsCreated,
              contacts: syncResults.contactsUpdated.length
            });

            successCount++;
            syncDetails.push({
              userId: integration.user_id,
              status: 'success',
              eventsProcessed: syncResults.eventsProcessed,
              artifactsCreated: syncResults.artifactsCreated,
              message: `Synced ${syncResults.eventsProcessed} events, created ${syncResults.artifactsCreated} artifacts`
            });

          } catch (error) {
            console.error(`❌ Error syncing user ${integration.user_id}:`, error);
            errorCount++;
            syncDetails.push({
              userId: integration.user_id,
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error'
            });
            errors.push(`User ${integration.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );

      // Delay between batches
      if (i + DEFAULT_CONFIG.batchSize < integrations.length) {
        console.log(`⏳ Waiting ${DEFAULT_CONFIG.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.delayBetweenBatches));
      }
    }

    const result = {
      success: true,
      message: `Nightly sync completed: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped`,
      summary: {
        totalUsers: integrations.length,
        successCount,
        errorCount,
        skippedCount,
        processingTimeMs: Date.now() - new Date().getTime()
      },
      details: syncDetails.slice(0, 50), // Limit details to prevent response bloat
      errors: errors.slice(0, 10), // Limit error details
      timestamp: new Date().toISOString(),
      config: DEFAULT_CONFIG
    };

    console.log('🎉 Nightly sync summary:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Nightly sync failed:', error);
    
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