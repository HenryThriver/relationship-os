import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingVoiceMemoType } from '@/types/userProfile';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio_file') as File;
    const memoType = formData.get('memo_type') as OnboardingVoiceMemoType;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!memoType || !['challenge', 'profile_enhancement', 'goal'].includes(memoType)) {
      return NextResponse.json({ error: 'Invalid memo type' }, { status: 400 });
    }

    // Get optional goal category for goal memos
    const goalCategory = formData.get('goal_category') as string | null;

    // Convert file to buffer for upload
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${user.id}/onboarding/${memoType}-${timestamp}.wav`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-memos')
      .upload(filename, buffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
    }

    // Public URL would be available if needed for playback
    // const { data: { publicUrl } } = supabase.storage
    //   .from('voice-memos')
    //   .getPublicUrl(filename);

    // Get or create user's self-contact
    let selfContact;
    const { data, error: selfContactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .single();

    selfContact = data;

    if (selfContactError && selfContactError.code !== 'PGRST116') {
      console.error('Error getting self contact:', selfContactError);
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
    }

    // Create self-contact if it doesn't exist
    if (!selfContact) {
      const { data: newSelfContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          is_self_contact: true,
          linkedin_url: '', // Required field, will be filled later
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating self contact:', createError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      selfContact = newSelfContact;
    }

    // Verify self-contact exists and belongs to user (for RLS)
    const { data: verifyContact, error: verifyError } = await supabase
      .from('contacts')
      .select('id, user_id, is_self_contact')
      .eq('id', selfContact.id)
      .eq('user_id', user.id)
      .single();

    if (verifyError || !verifyContact) {
      console.error('Self-contact verification failed:', verifyError);
      return NextResponse.json({ error: 'Failed to verify user profile' }, { status: 500 });
    }

    // Create voice memo artifact with proper fields for transcription processing
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        contact_id: selfContact.id,
        type: 'voice_memo',
        content: `Voice memo recorded for onboarding`, // Initial content
        audio_file_path: uploadData.path, // Required by transcription service
        transcription_status: 'pending', // Required by transcription service
        ai_parsing_status: 'pending', // Will be set to pending after transcription
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'onboarding_voice_recorder',
          memo_type: memoType,
          is_onboarding: 'true',
          file_size: buffer.length,
          original_filename: filename,
          ...(goalCategory && { goal_category: goalCategory })
        }
      })
      .select()
      .single();

    if (artifactError) {
      console.error('Artifact creation error:', artifactError);
      return NextResponse.json({ 
        error: 'Failed to create voice memo record'
      }, { status: 500 });
    }

    // Transcription and AI processing will be automatically triggered by database trigger
    
    return NextResponse.json({
      success: true,
      artifact_id: artifact.id,
      message: 'Voice memo uploaded successfully and processing started'
    });

  } catch (error) {
    console.error('Onboarding voice memo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 