import { NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createClient(
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

    // Disconnect Gmail
    await gmailService.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Gmail account disconnected successfully',
    });

  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to disconnect Gmail',
        success: false 
      },
      { status: 500 }
    );
  }
} 