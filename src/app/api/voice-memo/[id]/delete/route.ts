import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore
  });

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
      .eq('artifact_id', artifactIdToDelete)
      .in('status', ['approved', 'partial'])
      .limit(1);

    if (suggestionCheckError) {
      console.error('Error checking for approved suggestions:', suggestionCheckError);
      return NextResponse.json({ error: `Failed to check suggestion status: ${suggestionCheckError.message}` }, { status: 500 });
    }

    if (approvedSuggestions && approvedSuggestions.length > 0) {
      return NextResponse.json(
        { error: 'This voice memo cannot be deleted because one or more of its suggestions have been approved. Edits sourced from this memo might be active in a contact profile.' }, 
        { status: 403 } // Forbidden
      );
    }

    // 2. Retrieve the artifact to get its audio_file_path for storage deletion
    const { data: artifacts, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, type, audio_file_path')
      .eq('id', artifactIdToDelete);

    if (fetchError) {
      console.error('Error fetching artifact for deletion:', fetchError);
      return NextResponse.json({ error: `Error fetching artifact: ${fetchError.message}` }, { status: 500 });
    }

    if (!artifacts || artifacts.length === 0) {
      console.log(`Artifact ${artifactIdToDelete} not found for deletion. It might have been already deleted.`);
      // Return a success-like response or a specific message indicating it was already gone.
      // For idempotency, often a 200 or 204 is returned even if it was already deleted.
      return NextResponse.json({ message: 'Artifact not found or already deleted.', artifact_id: artifactIdToDelete }, { status: 200 }); 
    }
    
    // Since ID is unique, if artifacts.length > 0, it must be 1.
    const artifact = artifacts[0];

    if (artifact.type !== 'voice_memo') {
      return NextResponse.json({ error: 'Deletion target is not a voice memo.' }, { status: 400 });
    }

    // 3. Delete the artifact record from the database
    const { error: deleteArtifactError } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactIdToDelete);

    if (deleteArtifactError) {
      console.error('Error deleting artifact record:', deleteArtifactError);
      return NextResponse.json({ error: `Failed to delete artifact record: ${deleteArtifactError.message}` }, { status: 500 });
    }

    // 4. Delete the associated audio file from Supabase Storage (if path exists)
    if (artifact.audio_file_path) {
      const { error: deleteStorageError } = await supabase.storage
        .from('voice-memos')
        .remove([artifact.audio_file_path]);

      if (deleteStorageError) {
        // Log this error but consider the main deletion successful as the DB record is gone.
        // This prevents a case where the DB delete works but storage fails, leaving an orphaned file but a half-successful operation.
        // Alternatively, you could implement a more complex rollback or retry here.
        console.warn(`Successfully deleted artifact record ${artifactIdToDelete} but failed to delete from storage: ${deleteStorageError.message}`);
      }
    }

    return NextResponse.json({ message: 'Voice memo successfully deleted.', artifact_id: artifactIdToDelete });

  } catch (error: any) {
    console.error('Unexpected error during voice memo deletion:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 