import { NextRequest, NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailImportRequest } from '@/types/email';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { contact_id, email_addresses, date_range, max_results, include_labels, exclude_labels }: EmailImportRequest = body;

    // Validate required fields
    if (!contact_id) {
      return NextResponse.json(
        { error: 'contact_id is required' },
        { status: 400 }
      );
    }

    if (!email_addresses || email_addresses.length === 0) {
      return NextResponse.json(
        { error: 'email_addresses are required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component cookie handling
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contact_id)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found or access denied' },
        { status: 404 }
      );
    }

    // Update sync state to "syncing"
    await supabase
      .from('gmail_sync_state')
      .upsert({
        user_id: user.id,
        sync_status: 'syncing',
        error_message: null,
        last_sync_timestamp: new Date().toISOString(),
      });

    // Start email sync
    const progress = await gmailService.syncContactEmailsServer({
      contact_id,
      email_addresses,
      date_range,
      max_results: max_results || 100,
      include_labels,
      exclude_labels,
    }, user.id);

    return NextResponse.json({
      success: true,
      progress,
      message: `Successfully processed ${progress.processed_emails} emails`,
    });

  } catch (error) {
    console.error('Gmail sync error:', error);

    // Determine appropriate error message and status code
    let errorMessage = 'Failed to sync emails';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Gmail not connected')) {
        errorMessage = 'Gmail account not connected. Please connect your Gmail account first.';
        statusCode = 401;
      } else if (error.message.includes('refresh token')) {
        errorMessage = 'Gmail connection expired. Please reconnect your Gmail account.';
        statusCode = 401;
      } else if (error.message.includes('401 Unauthorized')) {
        errorMessage = 'Gmail authentication failed. Please reconnect your Gmail account.';
        statusCode = 401;
      } else {
        errorMessage = error.message;
      }
    }

    // Update sync state to "error"
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Server component cookie handling
              }
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('gmail_sync_state')
          .upsert({
            user_id: user.id,
            sync_status: 'error',
            error_message: errorMessage,
          });
      }
    } catch (syncStateError) {
      console.error('Error updating sync state:', syncStateError);
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        requiresReconnection: statusCode === 401
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get sync status for the current user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component cookie handling
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get sync state
    const syncState = await gmailService.getSyncStateServer(user.id);

    // Get Gmail connection status
    const { data: tokens } = await supabase
      .from('user_tokens')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry')
      .eq('user_id', user.id)
      .single();

    const isConnected = !!(tokens?.gmail_access_token);
    let profile = null;

    if (isConnected) {
      try {
        profile = await gmailService.getProfileServer(user.id);
      } catch (error) {
        console.error('Error getting Gmail profile:', error);
      }
    }

    return NextResponse.json({
      isConnected,
      profile: profile ? {
        email: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
      } : null,
      syncState: syncState ? {
        lastSync: syncState.last_sync_timestamp,
        status: syncState.sync_status,
        totalEmailsSynced: syncState.total_emails_synced,
        errorMessage: syncState.error_message,
      } : null,
    });

  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get Gmail status',
        isConnected: false 
      },
      { status: 500 }
    );
  }
} 