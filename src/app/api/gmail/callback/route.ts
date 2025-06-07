import { NextRequest, NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      console.error('Gmail OAuth error:', error);
      const errorUrl = new URL('/dashboard/settings/gmail', request.nextUrl.origin);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      const errorUrl = new URL('/dashboard/settings/gmail', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'No authorization code received');
      return NextResponse.redirect(errorUrl);
    }

    // Create Supabase client to verify user is authenticated
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      const errorUrl = new URL('/auth/login', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'Please log in first');
      return NextResponse.redirect(errorUrl);
    }

    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/gmail/callback`;
    
    try {
      await gmailService.exchangeCodeForTokensServer(code, redirectUri, user.id);

      // Get user's Gmail profile to verify connection
      const profile = await gmailService.getProfileServer(user.id);

      // Redirect to success page
      const successUrl = new URL('/dashboard/settings/gmail', request.nextUrl.origin);
      successUrl.searchParams.set('success', 'Gmail connected successfully');
      successUrl.searchParams.set('email', profile.emailAddress);
      
      return NextResponse.redirect(successUrl);

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      const errorUrl = new URL('/dashboard/settings/gmail', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'Failed to connect Gmail account');
      return NextResponse.redirect(errorUrl);
    }

  } catch (error) {
    console.error('Gmail callback error:', error);
    const errorUrl = new URL('/dashboard/settings/gmail', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { code, redirect_uri } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    if (!redirect_uri) {
      return NextResponse.json(
        { error: 'Redirect URI is required' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await gmailService.exchangeCodeForTokens(code, redirect_uri);

    // Get user's Gmail profile
    const profile = await gmailService.getProfile();

    return NextResponse.json({
      success: true,
      profile: {
        email: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
      },
      tokens: {
        // Don't expose actual tokens in response
        hasAccessToken: !!tokens.gmail_access_token,
        hasRefreshToken: !!tokens.gmail_refresh_token,
        expiresAt: tokens.gmail_token_expiry,
      },
    });

  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process Gmail callback',
        success: false 
      },
      { status: 500 }
    );
  }
} 