import { NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';
import { createClient } from '@/lib/supabase/server';

export async function POST(): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
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