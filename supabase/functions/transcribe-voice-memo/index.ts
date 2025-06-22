import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Buffer } from 'https://deno.land/std@0.177.0/io/buffer.ts';

// Define a type for the expected artifact record structure (subset)
interface VoiceMemoRecord {
  id: string;
  type: string;
  audio_file_path: string;
  transcription_status: string;
  // Add other fields if needed for validation or logging
}

console.log('Transcribe voice memo function booted');

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing one or more required environment variables: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  // Optional: throw an error to prevent the function from serving if misconfigured, 
  // but for Supabase Edge Functions, it might be better to let it serve and error on request.
}

// Helper to update artifact status and transcription
async function updateArtifact(supabaseAdmin: SupabaseClient, artifactId: string, updates: Record<string, any>) {
  const { error: updateError } = await supabaseAdmin
    .from('artifacts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', artifactId);

  if (updateError) {
    console.error(`Error updating artifact ${artifactId}:`, updateError.message);
    // Depending on the error, you might want to throw it or handle it
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let artifactId: string | undefined;

  try {
    // Ensure env vars are loaded (they are checked at startup, but good practice for runtime too if needed)
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Server configuration error: Missing API keys or URL.');
    }

    const { record } = await req.json() as { record: VoiceMemoRecord }; 
    artifactId = record?.id;

    if (!record || !record.id || !record.audio_file_path) {
      return new Response(JSON.stringify({ error: 'Invalid request payload: Missing record, id, or audio_file_path' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (record.type !== 'voice_memo' || record.transcription_status !== 'pending') {
      console.log(`Artifact ${record.id} is not a pending voice memo (type: ${record.type}, status: ${record.transcription_status}). Skipping.`);
      return new Response(JSON.stringify({ message: 'Artifact not eligible for transcription', artifactId: record.id }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Update status to 'processing'
    await updateArtifact(supabaseAdmin, record.id, { transcription_status: 'processing' });

    // 2. Get signed URL for audio file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('voice-memos')
      .createSignedUrl(record.audio_file_path, 60 * 5); // 5 minutes expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(`Error creating signed URL for ${record.audio_file_path}:`, signedUrlError?.message);
      await updateArtifact(supabaseAdmin, record.id, { transcription_status: 'failed', metadata: { error: 'Failed to get audio URL' } });
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
    }

    // 3. Download audio file
    const audioResponse = await fetch(signedUrlData.signedUrl);
    if (!audioResponse.ok) {
      await updateArtifact(supabaseAdmin, record.id, { transcription_status: 'failed', metadata: { error: 'Failed to download audio' } });
      throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
    }
    const audioBlob = await audioResponse.blob();
    
    // 4. Send to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, record.audio_file_path.split('/').pop() || 'audio.webm'); // Attempt to get filename
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Request verbose_json to get duration
    // formData.append('language', 'en'); // Optional: specify language

    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.json();
      console.error('OpenAI API error:', errorBody);
      await updateArtifact(supabaseAdmin, record.id, { transcription_status: 'failed', metadata: { error: `OpenAI API Error: ${errorBody?.error?.message || openaiResponse.statusText}` } });
      throw new Error(`OpenAI API request failed: ${openaiResponse.statusText}`);
    }

    const transcriptionResult = await openaiResponse.json();
    const transcriptionText = transcriptionResult.text;
    const durationFromApi = transcriptionResult.duration; // Duration in seconds from verbose_json

    if (typeof transcriptionText !== 'string') {
        await updateArtifact(supabaseAdmin, record.id, { transcription_status: 'failed', metadata: { error: 'Invalid transcription format from OpenAI'} });
        throw new Error('Invalid transcription format from OpenAI');
    }

    // 5. Update artifact with transcription and duration
    const updatePayload: Record<string, any> = {
      transcription: transcriptionText,
      content: transcriptionText, // Also update the main content field
      transcription_status: 'completed',
    };

    if (typeof durationFromApi === 'number') {
      updatePayload.duration_seconds = Math.round(durationFromApi);
    }

    await updateArtifact(supabaseAdmin, record.id, updatePayload);
    console.log(`Transcription completed for artifact ${record.id}`);

    // Now that transcription is complete, prepare and trigger AI parsing
    console.log(`Preparing to trigger AI parsing for artifact ${record.id}`);
    const aiParsingUpdatePayload = {
      ai_parsing_status: 'pending',
      ai_processing_started_at: new Date().toISOString(),
      ai_processing_completed_at: null, // Ensure this is cleared for reprocessing scenarios
    };
    await updateArtifact(supabaseAdmin, record.id, aiParsingUpdatePayload);
    console.log(`Artifact ${record.id} status updated for AI parsing.`);

    // Invoke the unified parse-artifact Edge Function
    const { data: functionData, error: functionError } = await supabaseAdmin.functions.invoke(
      'parse-artifact',
      { body: { artifactId: record.id } } 
    );

    if (functionError) {
      console.error(`Error invoking parse-artifact Edge Function for ${record.id}:`, functionError);
      // Optionally, update artifact to reflect this invocation error if critical
      // await updateArtifact(supabaseAdmin, record.id, { metadata: { ...record.metadata, ai_invocation_error: functionError.message } });
    } else {
      console.log(`Successfully invoked parse-artifact Edge Function for ${record.id}. Response:`, functionData);
    }

    return new Response(JSON.stringify({ message: 'Transcription successful, AI parsing initiated', artifactId: record.id, transcription: transcriptionText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Error in transcribe-voice-memo function (Artifact ID: ${artifactId || 'unknown'}):`, error.message);
    // If an error occurred after starting processing, try to mark as failed if artifactId is known
    if (artifactId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            await updateArtifact(supabaseAdmin, artifactId, { 
                transcription_status: 'failed', 
                metadata: { error: `Function error: ${error.message}` }
            });
        } catch (updateErr: any) {
            console.error(`Failed to update artifact ${artifactId} to 'failed' status after an error:`, updateErr.message);
        }
    }
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 