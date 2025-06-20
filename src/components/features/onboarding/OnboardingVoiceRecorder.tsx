'use client';

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { Mic, Stop, PlayArrow, Pause } from '@mui/icons-material';
import type { OnboardingVoiceMemoType } from '@/types/userProfile';

interface OnboardingVoiceRecorderProps {
  memoType: OnboardingVoiceMemoType;
  onRecordingComplete: (audioFile: File) => void;
  title: string;
  description: string;
  isProcessing?: boolean;
  disabled?: boolean;
}

export default function OnboardingVoiceRecorder({
  memoType,
  onRecordingComplete,
  title,
  description,
  isProcessing = false,
  disabled = false
}: OnboardingVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    if (audioBlob) {
      const file = new File([audioBlob], `${memoType}-${Date.now()}.wav`, {
        type: 'audio/wav'
      });
      onRecordingComplete(file);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Recording Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* Recording Time */}
          {(isRecording || audioBlob) && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatTime(recordingTime)}
              </Typography>
              {isRecording && (
                <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      bgcolor: 'error.main', 
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite'
                    }} 
                  />
                  Recording...
                </Typography>
              )}
            </Box>
          )}

          {/* Main Action Button */}
          {!audioBlob ? (
            <Button
              variant={isRecording ? 'outlined' : 'contained'}
              color={isRecording ? 'error' : 'primary'}
              size="large"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isProcessing}
              startIcon={isRecording ? <Stop /> : <Mic />}
              sx={{ 
                px: 4, 
                py: 2,
                borderRadius: 3,
                minWidth: 160
              }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Play/Pause Button */}
              <Button
                variant="outlined"
                onClick={isPlaying ? pausePlayback : playRecording}
                disabled={disabled || isProcessing}
                startIcon={isPlaying ? <Pause /> : <PlayArrow />}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              {/* Re-record Button */}
              <Button
                variant="outlined"
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                  setIsPlaying(false);
                }}
                disabled={disabled || isProcessing}
              >
                Re-record
              </Button>

              {/* Submit Button */}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={disabled || isProcessing}
                sx={{ px: 4 }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Use This Recording'
                )}
              </Button>
            </Box>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Processing your voice memo...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>

        {/* Instructions */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Tips:</strong> Speak clearly and take your time. 
            You can always re-record if you're not happy with the result.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 