import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';
import { TranscriptionStatus } from '@/types/artifact';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore
  });

  const resolvedParams = await params;
  const artifactId: string = resolvedParams.id;
  if (!artifactId) {
    return NextResponse.json({ error: 'Artifact ID is required' }, { status: 400 });
  }

  try {
    console.log(`[POST /api/voice-memo/reprocess] Received request for artifact ID: ${artifactId}`);

    // 1. Check if the artifact exists and is a voice memo
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, type, transcription_status, ai_parsing_status')
      .eq('id', artifactId)
      .single();

    if (fetchError) {
      console.error('Error fetching artifact for reprocessing:', fetchError);
      return NextResponse.json({ error: `Artifact not found: ${fetchError.message}` }, { status: 404 });
    }

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    if (artifact.type !== 'voice_memo') {
      return NextResponse.json({ error: 'Only voice memo artifacts can be reprocessed for AI parsing.' }, { status: 400 });
    }

    if (artifact.transcription_status !== 'completed') {
      return NextResponse.json({ error: 'AI parsing can only be retriggered if transcription is completed.' }, { status: 400 });
    }

    // 2. Reset ai_parsing_status to 'pending'
    const { error: updatePendingError } = await supabase
      .from('artifacts')
      .update({ ai_parsing_status: 'pending' })
      .eq('id', artifactId);

    if (updatePendingError) {
      console.error('Error setting artifact to pending for AI reprocessing:', updatePendingError);
      return NextResponse.json({ error: `Failed to reset AI parsing status: ${updatePendingError.message}` }, { status: 500 });
    }

    // 3. "Touch" the transcription_status to re-trigger the database trigger
    const { error: touchError } = await supabase
      .from('artifacts')
      .update({ transcription_status: 'completed' })
      .eq('id', artifactId);

    if (touchError) {
      console.error('Error touching artifact for AI reprocessing trigger:', touchError);
      // Note: Even if this specific update fails, the status is already pending.
      // The trigger might not fire immediately, but the state is set for a future attempt or manual check.
      // Depending on how critical immediate re-triggering is, this could be handled differently.
      return NextResponse.json({ error: `Failed to re-trigger AI parsing: ${touchError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'AI parsing successfully re-triggered for artifact.', artifact_id: artifactId });

  } catch (error: any) {
    console.error('Unexpected error during AI reprocessing trigger:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 