import { NextRequest, NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || `${request.nextUrl.origin}/api/gmail/callback`;
    const source = searchParams.get('source') || 'dashboard'; // 'onboarding' or 'dashboard'

    const authUrl = gmailService.getAuthUrl(redirectUri, source);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Gmail auth URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { redirect_uri } = body;

    if (!redirect_uri) {
      return NextResponse.json(
        { error: 'redirect_uri is required' },
        { status: 400 }
      );
    }

    const authUrl = gmailService.getAuthUrl(redirect_uri);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Gmail auth URL' },
      { status: 500 }
    );
  }
} 