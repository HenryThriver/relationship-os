'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import { Mic, Stop, CheckCircle } from '@mui/icons-material';
// import { useSupabaseClient } from '@supabase/auth-helpers-react'; // No longer using this hook
import { supabase } from '@/lib/supabase/client'; // Import the shared client directly
import { useAuth } from '@/lib/contexts/AuthContext'; 
import { Database } from '@/lib/supabase/types_db'; // Database types still useful
import { useQueryClient } from '@tanstack/react-query'; // Added import

interface VoiceRecorderProps {
  contactId: string;
  onRecordingComplete?: (artifact: any) => void; // Consider using a specific Artifact type
  onError?: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  contactId,
  onRecordingComplete,
  onError
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  
  // Refs for MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // const supabase = useSupabaseClient<Database>(); // Removed useSupabaseClient
  // supabase is now imported directly and available in the module scope
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient(); // Added queryClient

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!user) { // Check for user before starting recording
      const errorMessage = 'User not authenticated. Please log in to record.';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }
    try {
      setError('');
      setSuccess(false);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Optimized for speech recognition
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Handle data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording completion
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Reset chunks and stream for next recording BEFORE async operation
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        await handleRecordingComplete(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0); // Reset duration for new recording

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) { // Changed error variable name to avoid conflict
      console.error('Error starting recording:', err);
      const errorMessage = 'Failed to start recording. Please check microphone permissions.';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError, user]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // streamRef.current?.getTracks().forEach(track => track.stop()); // Moved to onstop
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsUploading(true);
    setUploadStatus('Uploading voice memo...');
    
    if (!user) { // Add user check here as well, as a safeguard
      const errMessage = 'User not authenticated';
      setError(errMessage);
      onError?.(errMessage);
      setIsUploading(false);
      setUploadStatus('');
      return;
    }
    
    try {
      // const { data: { user } } = await supabase.auth.getUser(); // No longer needed
      // if (!user) throw new Error('User not authenticated'); // Handled by useUser and the check above

      // Generate unique filename
      const timestamp = Date.now();
      // Use contactId in the path for better organization if desired, or just user.id
      const filename = `${user.id}/${contactId}-${timestamp}.webm`; 
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-memos')
        .upload(filename, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600'
        });
      
      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error('Upload failed, no data returned.'); // Check for null uploadData
      
      setUploadStatus('Creating voice memo record...');
      
      // Create artifact record - this will trigger the Edge Function
      const { data: artifact, error: insertError } = await supabase
        .from('artifacts')
        .insert({
          contact_id: contactId,
          user_id: user.id,
          type: 'voice_memo',
          content: `Voice memo recorded (${formatDuration(duration)})`, // Using current duration
          audio_file_path: uploadData.path,
          duration_seconds: duration, // Using current duration
          transcription_status: 'pending',
          // Ensure metadata structure matches DB if it's a JSONB column with specific schema
          metadata: { 
            file_size: blob.size,
            mime_type: blob.type,
            recorded_at: new Date().toISOString()
          } as any // Cast if metadata is strictly typed elsewhere and this is a general structure
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      if (!artifact) throw new Error('Failed to create artifact record.'); // Check for null artifact
      
      setUploadStatus('Processing transcription...');
      onRecordingComplete?.(artifact);
      
      // Start polling for transcription completion
      pollTranscriptionStatus(artifact.id);
      
    } catch (err) { 
      console.error('Error uploading voice memo (raw):', err);
      console.error('Error uploading voice memo (stringified):', JSON.stringify(err, null, 2));
      const errorMessage = err instanceof Error && err.message ? err.message : 
                         (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message :
                         'Upload failed. Please check console for details.';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsUploading(false); 
    }
  };

  const pollTranscriptionStatus = async (artifactId: string) => {
    const maxAttempts = 90; // Extended to 3 minutes max (90 attempts * 2s interval) for AI processing
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const { data: artifact, error: fetchError } = await supabase
          .from('artifacts')
          .select('transcription_status, transcription, ai_parsing_status')
          .eq('id', artifactId)
          .single();
        
        if (fetchError) throw fetchError;
        if (!artifact) throw new Error('Artifact not found during polling.');

        // Update status based on current phase
        if (artifact.transcription_status === 'pending') {
          setUploadStatus(`Transcribing audio... (${Math.round((attempts / maxAttempts) * 30)}%)`);
        } else if (artifact.transcription_status === 'completed' && artifact.ai_parsing_status === 'pending') {
          setUploadStatus(`Processing with AI... (${Math.round(30 + (attempts / maxAttempts) * 70)}%)`);
        } else if (artifact.ai_parsing_status === 'processing') {
          setUploadStatus(`Analyzing your message... (${Math.round(60 + (attempts / maxAttempts) * 40)}%)`);
        }
        
        // Check for completion - both transcription AND AI processing must be done
        if (artifact.transcription_status === 'completed' && artifact.ai_parsing_status === 'completed') {
          clearInterval(pollInterval);
          setUploadStatus('');
          setIsUploading(false);
          setSuccess(true);
          setDuration(0); // Reset duration after successful upload and processing
          
          // Invalidate queries
          await queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
          await queryClient.invalidateQueries({ queryKey: ['contactUpdateSuggestions', contactId] });
          await queryClient.invalidateQueries({ queryKey: ['artifacts', contactId] });
          await queryClient.invalidateQueries({ queryKey: ['contacts', contactId] });

          setTimeout(() => setSuccess(false), 5000);
        } 
        // Check for transcription failure
        else if (artifact.transcription_status === 'failed') {
          clearInterval(pollInterval);
          setError('We had trouble understanding your audio. Please try recording again with clear speech.');
          setUploadStatus('');
          setIsUploading(false);
        } 
        // Check for AI processing failure
        else if (artifact.ai_parsing_status === 'failed') {
          clearInterval(pollInterval);
          setError('We had trouble processing your message. Your recording was saved, but the analysis may be incomplete. Please try again if needed.');
          setUploadStatus('');
          setIsUploading(false);
        } 
        // Check for timeout
        else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setError('Processing is taking longer than expected. Your recording was saved and will be processed shortly. Please check back in a few minutes.');
          setUploadStatus('');
          setIsUploading(false);
        }
      } catch (err) {
        console.error('Error polling processing status:', err);
        // Only clear interval and show error if it's a persistent issue or max attempts reached
        if (attempts >= maxAttempts || (err instanceof Error && !err.message.includes('FetchError'))) {
          clearInterval(pollInterval);
          setError('Unable to check processing status. Your recording may still be processing - please check back later.');
          setUploadStatus('');
          setIsUploading(false);
        }
      }
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Disable recording button if user is not available yet, or show loading state
  if (authLoading) { // Use authLoading from your useAuth hook
    return (
      <Card sx={{mb: 2}}>
        <CardContent sx={{textAlign: 'center'}}>
          <CircularProgress />
          <Typography sx={{mt:1}}>Loading recorder...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{mb: 2}}> {/* Changed from className to sx for MUI Card */}
      <CardContent>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}> {/* sx instead of className */}
          <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}> {/* sx & gap */}
            <Mic color="primary" />
            Record Voice Memo
          </Typography>
          {isUploading && !success && <CircularProgress size={24} />}
          {success && <CheckCircle color="success" sx={{fontSize: 28}} />}
        </Box>
        
        <Box sx={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: {xs: 2, sm: 4}, // Responsive padding
            border: '2px dashed', 
            borderColor: 'grey.300', 
            borderRadius: 2, // MUI borderRadius
            bgcolor: 'grey.50', 
            '&:hover': { bgcolor: 'grey.100' },
            transition: 'background-color 0.3s'
        }}>
          <Box sx={{textAlign: 'center'}}>
            <IconButton
              onClick={isRecording ? stopRecording : startRecording}
              color={isRecording ? "error" : "primary"}
              size="large"
              disabled={isUploading || !user} // Disable if no user or uploading
              sx={{
                width: { xs: 60, sm: 80 }, // Responsive size
                height: { xs: 60, sm: 80 },
                border: 2,
                borderColor: isRecording ? 'error.main' : 'primary.main',
                // Use theme colors for consistency
                backgroundColor: isRecording ? (theme) => theme.palette.error.light : (theme) => theme.palette.primary.light,
                color: isRecording ? (theme) => theme.palette.error.contrastText : (theme) => theme.palette.primary.contrastText,
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: isRecording ? (theme) => theme.palette.error.dark : (theme) => theme.palette.primary.dark,
                },
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(0,0,0, 0.2)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(0,0,0, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(0,0,0, 0)' },
                }
              }}
            >
              {isRecording ? <Stop sx={{ fontSize: {xs: 30, sm: 40} }} /> : <Mic sx={{ fontSize: {xs: 30, sm: 40} }} />}
            </IconButton>
            
            <Typography variant="h6" sx={{mt: 2, fontWeight: 500}}>
              {isRecording ? `${formatDuration(duration)}` : (user ? 'Tap to Record' : 'Login to Record')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{minHeight: '1.5em'}}>
              {isRecording 
                ? 'Recording in progress...' 
                : (isUploading && uploadStatus) ? uploadStatus 
                : !user ? 'You must be logged in to record voice memos.'
                : 'Max 2 minutes. Click the icon to start.'
              }
            </Typography>

            {isRecording && (
              <Box sx={{mt: 2, width: '80%', maxWidth: 150, mx: 'auto'}}>
                <LinearProgress 
                  variant="indeterminate" 
                  color={isRecording ? "error" : "primary"}
                  sx={{ height: 5, borderRadius: '2.5px' }}
                />
              </Box>
            )}
          </Box>
        </Box>
        
        {error && !isUploading && ( // Only show general error if not in an upload state
          <Alert severity="error" sx={{mt: 2}}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{mt: 2}}>
            ✨ Thank you for sharing! Your message has been processed and will help personalize your experience.
          </Alert>
        )}
        
        {!isRecording && !isUploading && !error && !success && user && (
           <Typography variant="caption" color="text.secondary" sx={{display:'block', mt: 2, textAlign: 'center'}}>
            Memos are transcribed and saved as artifacts for this contact.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Helper to ensure Supabase types are used, if you have them generated
// import { Database } from '@/lib/supabase/types_db';
// const supabase = useSupabaseClient<Database>();
