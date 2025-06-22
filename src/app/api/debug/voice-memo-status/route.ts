import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get voice memos for this user with more details
    const { data: voiceMemos, error: fetchError } = await supabase
      .from('artifacts')
      .select('id, type, transcription_status, ai_parsing_status, audio_file_path, created_at, metadata, contact_id, transcription, content')
      .eq('type', 'voice_memo')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Also get contact info to see if these are self-contact memos
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, is_self_contact, name')
      .eq('user_id', user.id);

    const contactMap = contacts?.reduce((acc, contact) => {
      acc[contact.id] = contact;
      return acc;
    }, {} as Record<string, any>) || {};

    if (fetchError) {
      console.error('Error fetching voice memos:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch voice memos' }, { status: 500 });
    }

    // Enhance voice memos with contact info
    const enhancedVoiceMemos = voiceMemos?.map(vm => {
      const metadata = vm.metadata as Record<string, any> || {};
      return {
        ...vm,
        contact_info: contactMap[vm.contact_id] || null,
        is_onboarding: metadata.is_onboarding === 'true' || metadata.source === 'onboarding_voice_recorder',
        memo_type: metadata.memo_type || 'unknown',
        has_transcription: !!vm.transcription,
        transcription_preview: vm.transcription ? vm.transcription.substring(0, 100) + '...' : null
      };
    }) || [];

    return NextResponse.json({
      user_id: user.id,
      voice_memos: enhancedVoiceMemos,
      summary: {
        total: voiceMemos?.length || 0,
        onboarding_memos: enhancedVoiceMemos.filter(vm => vm.is_onboarding).length,
        self_contact_memos: enhancedVoiceMemos.filter(vm => vm.contact_info?.is_self_contact).length,
        regular_memos: enhancedVoiceMemos.filter(vm => !vm.contact_info?.is_self_contact).length,
        pending_transcription: voiceMemos?.filter(vm => vm.transcription_status === 'pending').length || 0,
        processing_transcription: voiceMemos?.filter(vm => vm.transcription_status === 'processing').length || 0,
        completed_transcription: voiceMemos?.filter(vm => vm.transcription_status === 'completed').length || 0,
        failed_transcription: voiceMemos?.filter(vm => vm.transcription_status === 'failed').length || 0,
        pending_ai: voiceMemos?.filter(vm => vm.ai_parsing_status === 'pending').length || 0,
        processing_ai: voiceMemos?.filter(vm => vm.ai_parsing_status === 'processing').length || 0,
        completed_ai: voiceMemos?.filter(vm => vm.ai_parsing_status === 'completed').length || 0,
        failed_ai: voiceMemos?.filter(vm => vm.ai_parsing_status === 'failed').length || 0,
      }
    });

  } catch (error) {
    console.error('Voice memo status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, artifact_id } = await request.json();

    if (action === 'fix_pending_memos') {
      // Find voice memos that don't have proper fields set
      const { data: brokenMemos, error: fetchError } = await supabase
        .from('artifacts')
        .select('id, audio_file_path, transcription_status')
        .eq('type', 'voice_memo')
        .eq('user_id', user.id)
        .is('audio_file_path', null);

      if (fetchError) {
        return NextResponse.json({ error: 'Failed to fetch broken memos' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Found memos without audio_file_path',
        broken_memos: brokenMemos || [],
        action_needed: 'These memos need to be re-uploaded or fixed manually'
      });
    }

    if (action === 'trigger_transcription' && artifact_id) {
      // Manually trigger transcription for a specific artifact
      const { data: artifact, error: fetchError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', artifact_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !artifact) {
        return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
      }

      if (artifact.type !== 'voice_memo') {
        return NextResponse.json({ error: 'Not a voice memo' }, { status: 400 });
      }

      // Call the transcribe-voice-memo edge function directly
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'transcribe-voice-memo',
        { body: { record: artifact } }
      );

      if (functionError) {
        console.error('Error invoking transcribe-voice-memo:', functionError);
        return NextResponse.json({ 
          error: 'Failed to trigger transcription',
          details: functionError 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Transcription triggered successfully',
        artifact_id,
        function_response: functionData
      });
    }

    if (action === 'reprocess_onboarding_ai' && artifact_id) {
      // Reprocess AI parsing for onboarding voice memos with the new specialized prompt
      const { data: artifact, error: fetchError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', artifact_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !artifact) {
        return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
      }

      if (artifact.type !== 'voice_memo') {
        return NextResponse.json({ error: 'Not a voice memo' }, { status: 400 });
      }

      if (!artifact.transcription) {
        return NextResponse.json({ error: 'No transcription available for AI processing' }, { status: 400 });
      }

      // Reset AI parsing status and trigger reprocessing
      const { error: updateError } = await supabase
        .from('artifacts')
        .update({
          ai_parsing_status: 'pending',
          ai_processing_started_at: new Date().toISOString(),
          ai_processing_completed_at: null
        })
        .eq('id', artifact_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to reset AI status' }, { status: 500 });
      }

      // Call the unified parse-artifact edge function directly
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'parse-artifact',
        { body: { artifactId: artifact_id } }
      );

      if (functionError) {
        console.error('Error invoking parse-artifact:', functionError);
        return NextResponse.json({ 
          error: 'Failed to trigger AI reprocessing',
          details: functionError 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'AI reprocessing triggered successfully for onboarding memo',
        artifact_id,
        function_response: functionData
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Voice memo trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 