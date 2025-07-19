import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const contentType = formData.get('contentType') as string;
    const meetingArtifactId = formData.get('meetingArtifactId') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File;
    
    if (!contentType || !meetingArtifactId) {
      return NextResponse.json(
        { error: 'Content type and meeting artifact ID are required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get current meeting artifact
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('content, metadata')
      .eq('id', meetingArtifactId)
      .single();
    
    if (fetchError || !artifact) {
      return NextResponse.json(
        { error: 'Meeting artifact not found' },
        { status: 404 }
      );
    }
    
    // Parse existing content
    let meetingContent: Record<string, unknown> = {};
    try {
      meetingContent = typeof artifact.content === 'string' 
        ? JSON.parse(artifact.content) 
        : artifact.content || {};
    } catch {
      meetingContent = {};
    }
    
    // Handle different content types
    if (contentType === 'recording' && file) {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${meetingArtifactId}-recording.${fileExt}`;
      const filePath = `meeting-recordings/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('artifacts')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload recording' },
          { status: 500 }
        );
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artifacts')
        .getPublicUrl(filePath);
      
      meetingContent.recording_url = publicUrl;
    } else if (content && (contentType === 'notes' || contentType === 'transcript')) {
      meetingContent[contentType] = content;
    } else {
      return NextResponse.json(
        { error: 'Invalid content type or missing content' },
        { status: 400 }
      );
    }
    
    // Update the artifact
    const { error: updateError } = await supabase
      .from('artifacts')
      .update({
        content: JSON.stringify(meetingContent),
        ai_parsing_status: 'pending', // Trigger AI processing
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingArtifactId);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update meeting artifact' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      artifact_id: meetingArtifactId,
      content_type: contentType 
    });
  } catch (error) {
    console.error('Error in add meeting content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 