import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const resolvedParams = await params;
  const artifactIdToDelete: string = resolvedParams.id;
  if (!artifactIdToDelete) {
    return NextResponse.json({ error: 'Artifact ID is required for deletion' }, { status: 400 });
  }

  try {
    console.log(`[DELETE /api/voice-memo] Received request to delete artifact ID: ${artifactIdToDelete}`);

    // 1. Check if the artifact has any 'approved' or 'partial' suggestions
    const { data: approvedSuggestions, error: suggestionCheckError } = await supabase
      .from('contact_update_suggestions')
      .select('id')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('artifact_id', artifactIdToDelete as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .in('status', ['approved', 'partial'] as any)
      .limit(1);

    if (suggestionCheckError) {
      console.error('Error checking for approved suggestions:', suggestionCheckError);
      return NextResponse.json({ error: `Failed to check suggestion status: ${suggestionCheckError.message}` }, { status: 500 });
    }

    if (approvedSuggestions && approvedSuggestions.length > 0) {
      return NextResponse.json(
        { error: 'This voice memo cannot be deleted because one or more of its suggestions have been approved. Edits sourced from this memo might be active in a contact profile.' }, 
        { status: 403 }
      );
    }

    // 2. Retrieve the artifact to get its audio_file_path for storage deletion
    const { data: artifacts, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, type, audio_file_path')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', artifactIdToDelete as any);

    if (fetchError) {
      console.error('Error fetching artifact for deletion:', fetchError);
      return NextResponse.json({ error: `Error fetching artifact: ${fetchError.message}` }, { status: 500 });
    }

    if (!artifacts || artifacts.length === 0) {
      console.log(`Artifact ${artifactIdToDelete} not found for deletion. It might have been already deleted.`);
      return NextResponse.json({ message: 'Artifact not found or already deleted.', artifact_id: artifactIdToDelete }, { status: 200 }); 
    }
    
    // Since ID is unique, if artifacts.length > 0, it must be 1.
    const artifact = artifacts[0];

    if (artifact && artifact.type !== 'voice_memo') {
      return NextResponse.json({ error: 'Deletion target is not a voice memo.' }, { status: 400 });
    }

    // 3. Delete the artifact record from the database
    const { error: deleteArtifactError } = await supabase
      .from('artifacts')
      .delete()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', artifactIdToDelete as any);

    if (deleteArtifactError) {
      console.error('Error deleting artifact record:', deleteArtifactError);
      return NextResponse.json({ error: `Failed to delete artifact record: ${deleteArtifactError.message}` }, { status: 500 });
    }

    // 4. Delete the associated audio file from Supabase Storage (if path exists)
    if (artifact && artifact.audio_file_path) {
      const { error: deleteStorageError } = await supabase.storage
        .from('voice-memos')
        .remove([artifact.audio_file_path]);

      if (deleteStorageError) {
        console.warn(`Successfully deleted artifact record ${artifactIdToDelete} but failed to delete from storage: ${deleteStorageError.message}`);
      }
    }

    return NextResponse.json({ message: 'Voice memo successfully deleted.', artifact_id: artifactIdToDelete });

  } catch (error: unknown) {
    console.error('Unexpected error during voice memo deletion:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 