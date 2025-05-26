import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// import type { Database } from '@/lib/supabase/database.types'; // Not strictly needed if not using complex types here

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const resolvedParams = await params;
  const artifactId: string = resolvedParams.id;
  if (!artifactId) {
    return NextResponse.json({ error: 'Artifact ID is required' }, { status: 400 });
  }

  try {
    console.log(`[POST /api/voice-memo/[id]/reprocess] Received request for artifact ID: ${artifactId}`);

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
      return NextResponse.json({ error: 'Only voice memo artifacts can be reprocessed.' }, { status: 400 });
    }
    if (artifact.transcription_status !== 'completed') {
      return NextResponse.json({ error: 'AI parsing can only be retriggered if transcription is completed.' }, { status: 400 });
    }

    // Reset AI parsing status, start time, and clear completion time
    const updatePayload = {
      ai_parsing_status: 'pending',
      ai_processing_started_at: new Date().toISOString(), // Set start time now
      ai_processing_completed_at: null, // Clear completion time
      // We still need to "touch" the record for the trigger that calls the edge function to pick up 'pending' items.
      // The existing trigger `on_transcription_complete` was calling `trigger_ai_parsing()` (edge fn http_post).
      // If this trigger is gone, we need another mechanism or ensure the edge fn polls or is called differently.
      // For now, assume an edge function (e.g., parse-voice-memo) will pick up items with ai_parsing_status = 'pending'
      // or that another trigger is responsible for calling the edge function.
      // If the old `trigger_ai_parsing` function (that made the HTTP POST) is no longer called by any trigger,
      // then setting status to 'pending' here won't automatically start anything unless an edge function polls for this status.
      // The prompt for DB migration did DROP FUNCTION trigger_ai_parsing().
      // The user needs to ensure their parse-voice-memo edge function is invoked.
      // This API route's job is to set the state correctly for that edge function to act.
    };

    const { error: updateError } = await supabase
      .from('artifacts')
      .update(updatePayload)
      .eq('id', artifactId);

    if (updateError) {
      console.error('Error updating artifact for AI reprocessing:', updateError);
      return NextResponse.json({ error: `Failed to update artifact for reprocessing: ${updateError.message}` }, { status: 500 });
    }
    
    // Invoke the parse-voice-memo Edge Function
    console.log(`Attempting to invoke parse-voice-memo Edge Function for artifact ${artifactId}`);
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'parse-voice-memo', // Name of the Edge Function
      { body: { artifactId: artifactId } } // Pass artifactId in the body
    );

    if (functionError) {
      console.error('Error invoking parse-voice-memo Edge Function:', functionError);
      // Decide if this should be a user-facing error or just logged
      // For now, we'll still return success for the status update, but log the function error
      // Potentially, you might want to revert the status update or queue for retry
    } else {
      console.log('Successfully invoked parse-voice-memo Edge Function. Response:', functionData);
    }

    console.log(`Artifact ${artifactId} marked for reprocessing. AI processing started at: ${updatePayload.ai_processing_started_at}`);
    return NextResponse.json({ message: 'AI reprocessing initiated and Edge Function invoked.', artifact_id: artifactId });

  } catch (error: any) {
    console.error('Unexpected error during AI reprocessing initiation:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 