import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncUserCalendarData } from '@/lib/services/googleCalendarService';
import type { CalendarSyncOptions } from '@/types/calendar';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for sync options
    let syncOptions: Partial<CalendarSyncOptions> = {};
    try {
      const body = await request.json();
      syncOptions = body.options || {};
    } catch {
      // Use default options if no body or invalid JSON
    }

    // Set default sync options
    const options: CalendarSyncOptions = {
      startDate: syncOptions.startDate ? new Date(syncOptions.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      endDate: syncOptions.endDate ? new Date(syncOptions.endDate) : new Date(), // Today
      maxResults: syncOptions.maxResults || 250,
      includeDeclined: syncOptions.includeDeclined ?? false,
      singleEvents: syncOptions.singleEvents ?? true,
    };

    // Check if user has Google Calendar integration
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_calendar')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Google Calendar integration not found. Please connect your calendar first.' },
        { status: 400 }
      );
    }

    // Start the sync process
    try {
      const results = await syncUserCalendarData(user.id, supabase, options);
      
      return NextResponse.json({
        success: true,
        message: 'Calendar sync completed successfully',
        results,
      });
    } catch (syncError) {
      console.error('Calendar sync error:', syncError);
      
      // Check if error is due to invalid tokens
      if (syncError instanceof Error && 
          (syncError.message.includes('invalid_grant') || 
           syncError.message.includes('invalid_token'))) {
        
        // Clear invalid integration from database
        await supabase
          .from('user_integrations')
          .delete()
          .eq('user_id', user.id)
          .eq('integration_type', 'google_calendar');
        
        return NextResponse.json(
          { 
            error: 'Calendar connection expired. Please reconnect your Google Calendar.',
            requiresReconnection: true
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Calendar sync failed',
          details: syncError instanceof Error ? syncError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in calendar sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get sync status and recent logs
    const { data: logs, error: logsError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('sync_started_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error fetching sync logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }

    // Get integration status
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('id, created_at, updated_at, metadata, access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_calendar')
      .single();

    // Test if integration is actually working if tokens exist
    let isConnected = !!integration?.access_token;
    
    if (isConnected) {
      try {
        // Test the connection by trying to make a simple API call
        const { GoogleCalendarService } = await import('@/lib/services/googleCalendarService');
        const calendarService = new GoogleCalendarService(supabase);
        
        // This will throw an error if tokens are invalid
        await calendarService.fetchMeetings(integration, {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          endDate: new Date(),
          maxResults: 1
        });
      } catch (error) {
        console.error('Calendar connection test failed:', error);
        
        // If connection test fails due to invalid tokens, clear the integration
        if (error instanceof Error && 
            (error.message.includes('invalid_grant') || 
             error.message.includes('invalid_token'))) {
          
          isConnected = false;
          
          // Clear invalid integration from database
          await supabase
            .from('user_integrations')
            .delete()
            .eq('user_id', user.id)
            .eq('integration_type', 'google_calendar');
        }
      }
    }

    return NextResponse.json({
      integration: integration && isConnected ? {
        connected: true,
        connectedAt: integration.created_at,
        lastUpdated: integration.updated_at,
        metadata: integration.metadata,
      } : {
        connected: false,
      },
      recentSyncs: logs || [],
    });

  } catch (error) {
    console.error('Unexpected error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 