import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DebugArtifact {
  id: string;
  type: string | null;
  contact_id: string | null;
  ai_parsing_status: string | null;
  created_at: string;
  metadata: {
    message_id?: string;
    subject?: string;
    [key: string]: unknown;
  } | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Get contact_id from query params
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id') || '03df0988-4cc8-44bc-b9af-3abf0342760c';
    
    // Get all artifacts to see what types exist
    const { data: allArtifacts, error: allArtifactsError } = await supabase
      .from('artifacts')
      .select('id, type, contact_id, ai_parsing_status, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<DebugArtifact[]>();

    if (allArtifactsError) {
      console.error('Error fetching all artifacts:', allArtifactsError);
      return NextResponse.json({ error: allArtifactsError.message }, { status: 500 });
    }

    // Focus on the specific contact
    const contactArtifacts = allArtifacts?.filter((artifact: DebugArtifact) => artifact.contact_id === contactId) || [];
    
    // Look specifically for email-like artifacts
    const emailLikeArtifacts = allArtifacts?.filter((artifact: DebugArtifact) => {
      const metadata = artifact.metadata;
      return artifact.type?.includes('email') || 
             metadata?.message_id ||
             metadata?.subject;
    }) || [];

    // Format the response for better debugging
    const formatArtifact = (artifact: DebugArtifact) => {
      const metadata = artifact.metadata;
      return {
        id: artifact.id,
        type: artifact.type,
        type_type: typeof artifact.type,
        type_length: artifact.type?.length,
        type_chars: artifact.type ? Array.from(artifact.type as string).map((c: string) => c.charCodeAt(0)) : null,
        contact_id: artifact.contact_id,
        ai_parsing_status: artifact.ai_parsing_status,
        created_at: artifact.created_at,
        has_message_id: !!metadata?.message_id,
        has_subject: !!metadata?.subject,
        subject: metadata?.subject,
      };
    };

    return NextResponse.json({
      debug_info: {
        target_contact_id: contactId,
        total_artifacts: allArtifacts?.length || 0,
        contact_artifacts_count: contactArtifacts.length,
        email_like_artifacts_count: emailLikeArtifacts.length,
      },
      contact_artifacts: contactArtifacts.map(formatArtifact),
      email_like_artifacts: emailLikeArtifacts.map(formatArtifact),
      all_artifact_types: [...new Set(allArtifacts?.map((a: DebugArtifact) => a.type) || [])],
    });

  } catch (error: unknown) {
    console.error('Debug email status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: errorMessage },
      { status: 500 }
    );
  }
} 