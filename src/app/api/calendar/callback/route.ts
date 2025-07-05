import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This should contain user ID and source
  const error = searchParams.get('error');

  // Parse state to get user ID and source
  const [userId, source = 'dashboard'] = state ? state.split('|') : [];
  const isFromOnboarding = source === 'onboarding';

  try {

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const redirectUrl = isFromOnboarding 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=${encodeURIComponent(`OAuth error: ${error}`)}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=oauth_error&message=${encodeURIComponent(error)}`;
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !state || !userId) {
      const redirectUrl = isFromOnboarding
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=Missing authentication parameters`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=missing_params`;
      return NextResponse.redirect(redirectUrl);
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || user.id !== userId) {
      console.error('User verification failed:', userError);
      const redirectUrl = isFromOnboarding
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=User verification failed`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=unauthorized`;
      return NextResponse.redirect(redirectUrl);
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`
    );

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Store the integration in the database
      const { error: insertError } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          integration_type: 'google_calendar',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          scopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
          metadata: {
            connected_at: new Date().toISOString(),
            token_type: tokens.token_type || 'Bearer',
          },
        }, {
          onConflict: 'user_id,integration_type',
        });

      if (insertError) {
        console.error('Error storing integration:', insertError);
        const redirectUrl = isFromOnboarding
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=Failed to save calendar connection`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=storage_error`;
        return NextResponse.redirect(redirectUrl);
      }

      // Success - redirect based on source
      const successUrl = isFromOnboarding
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?success=Google Calendar connected successfully`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?success=calendar_connected`;
      return NextResponse.redirect(successUrl);

    } catch (tokenError) {
      console.error('Error exchanging code for tokens:', tokenError);
      const redirectUrl = isFromOnboarding
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=Failed to connect Google Calendar`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=token_exchange_failed`;
      return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Unexpected error in calendar callback:', error);
    const redirectUrl = isFromOnboarding
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?error=An unexpected error occurred`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=unexpected_error`;
    return NextResponse.redirect(redirectUrl);
  }
} 