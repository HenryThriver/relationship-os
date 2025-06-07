import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artifactId } = await params;

    if (!artifactId) {
      return NextResponse.json(
        { error: 'Artifact ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, verify the artifact exists and get its current state
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();

    if (fetchError || !artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Check if the artifact is suitable for AI parsing
    const supportedTypes = ['email', 'voice_memo', 'meeting'];
    if (!supportedTypes.includes(artifact.type)) {
      return NextResponse.json(
        { error: `Artifact type '${artifact.type}' is not supported for AI parsing` },
        { status: 400 }
      );
    }

    // Additional validation based on artifact type
    if (artifact.type === 'voice_memo' && (!artifact.transcription || artifact.transcription_status !== 'completed')) {
      return NextResponse.json(
        { error: 'Voice memo must have completed transcription before AI parsing' },
        { status: 400 }
      );
    }

    if ((artifact.type === 'email' || artifact.type === 'meeting') && !artifact.content) {
      return NextResponse.json(
        { error: `${artifact.type} must have content before AI parsing` },
        { status: 400 }
      );
    }

    // Delete existing suggestions for this artifact (so we start fresh)
    const { error: deleteSuggestionsError } = await supabase
      .from('contact_update_suggestions')
      .delete()
      .eq('artifact_id', artifactId);

    if (deleteSuggestionsError) {
      console.error('Error deleting existing suggestions:', deleteSuggestionsError);
      // Continue anyway - not critical
    }

    // Reset the AI parsing status to pending to trigger reprocessing
    const { error: updateError } = await supabase
      .from('artifacts')
      .update({
        ai_parsing_status: 'pending',
        ai_processing_started_at: null,
        ai_processing_completed_at: null,
      })
      .eq('id', artifactId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reset artifact processing status' },
        { status: 500 }
      );
    }

    // Trigger the edge function for reprocessing
    try {
      const edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/parse-artifact';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        throw new Error('Service role key not configured');
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          artifactId: artifactId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function call failed:', response.status, errorText);
        // Don't fail the request - the artifact status is already reset
        // so it will be picked up by other triggers
      }
    } catch (edgeError) {
      console.error('Error calling edge function:', edgeError);
      // Don't fail the request - the artifact status is already reset
    }

    return NextResponse.json({
      success: true,
      message: 'Artifact reprocessing initiated',
      artifactId: artifactId,
    });

  } catch (error) {
    console.error('Error in reprocess endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 