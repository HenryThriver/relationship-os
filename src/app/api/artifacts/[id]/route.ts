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
  const artifactId: string = resolvedParams.id;

  if (!artifactId) {
    return NextResponse.json({ error: 'Artifact ID is required' }, { status: 400 });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user or no user found:', userError);
      return NextResponse.json({ error: 'You must be logged in to delete an artifact.' }, { status: 401 });
    }

    // 1. Fetch the artifact
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, user_id, contact_id, type, metadata') // Include metadata for file_path
      .eq('id', artifactId)
      .single();

    if (fetchError) {
      // Check if the error is because the artifact was not found
      if (fetchError.code === 'PGRST116') { // PostgREST error for "No rows found"
        return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
      }
      console.error('Error fetching artifact:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch artifact details.' }, { status: 500 });
    }

    if (!artifact) { // Should be caught by PGRST116, but as a safeguard
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    // 2. Verify ownership (explicit check in addition to RLS)
    if (artifact.user_id !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to delete this artifact.' }, { status: 403 });
    }

    // 3. Source Data Check
    // 3a. Check contacts.field_sources
    let isSourceInContacts = false;
    if (artifact.contact_id) {
      const { data: contact, error: contactFetchError } = await supabase
        .from('contacts')
        .select('field_sources')
        .eq('id', artifact.contact_id as string)
        .eq('user_id', user.id) // Ensure we only check the contact owned by the user
        .single();

      if (contactFetchError && contactFetchError.code !== 'PGRST116') {
        console.error('Error fetching contact for source check:', contactFetchError);
        // Non-critical error, proceed but log it. Deletion safety relies more on suggestion check.
      }
      
      if (contact && contact.field_sources && typeof contact.field_sources === 'object') {
        const fieldSources = contact.field_sources as Record<string, string>;
        for (const key in fieldSources) {
          if (fieldSources[key] === artifactId) {
            isSourceInContacts = true;
            break;
          }
        }
      }
    }
    
    // 3b. If voice_memo, check contact_update_suggestions
    let isSourceInSuggestions = false;
    if (artifact.type === 'voice_memo') { // Using string literal
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('contact_update_suggestions')
        .select('id, status')
        .eq('artifact_id', artifactId)
        .or('status.eq.approved,status.eq.partial'); // Check for approved or partial suggestions

      if (suggestionsError) {
        console.error('Error checking contact_update_suggestions:', suggestionsError);
        return NextResponse.json({ error: 'Failed to check artifact usage in suggestions.' }, { status: 500 });
      }
      if (suggestions && suggestions.length > 0) {
        isSourceInSuggestions = true;
      }
    }

    if (isSourceInContacts || isSourceInSuggestions) {
      return NextResponse.json({ 
        error: 'This artifact cannot be deleted because it is used as a source for contact profile information or has approved/partially-approved suggestions.',
        code: 'ARTIFACT_IS_SOURCE' 
      }, { status: 409 });
    }

    // 4. Delete from artifacts table
    const { error: deleteArtifactError } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactId);

    if (deleteArtifactError) {
      console.error('Error deleting artifact from table:', deleteArtifactError);
      return NextResponse.json({ error: 'Failed to delete artifact.' }, { status: 500 });
    }

    // 5. If voice memo and has file_path, delete from Storage
    if (artifact.type === 'voice_memo' && artifact.metadata && 
        typeof artifact.metadata === 'object' && 'file_path' in artifact.metadata) {
      const filePath = (artifact.metadata as { file_path?: string }).file_path;
      if (filePath && typeof filePath === 'string') {
        const { error: deleteStorageError } = await supabase.storage
          .from('voice_memos') // Assuming 'voice_memos' is your bucket name
          .remove([filePath]);
        
        if (deleteStorageError) {
          // Log this error, but don't fail the whole operation if DB delete succeeded.
          // The artifact record is gone, which is the primary goal. Orphaned storage is a cleanup task.
          console.error('Failed to delete voice memo file from storage, but artifact record deleted:', deleteStorageError);
        }
      }
    }

    return new NextResponse(null, { status: 204 }); // Successfully deleted, no content to return

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/artifacts/[id]:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
} 