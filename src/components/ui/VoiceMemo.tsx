'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  IconButton,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  RadioButtonChecked as RecordingIcon,
} from '@mui/icons-material';

interface VoiceMemoProps {
  onRecordingComplete: (audioFile: File) => void;
  onProcessingStatusChange?: (isProcessing: boolean) => void;
  isProcessing?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}

export const VoiceMemo: React.FC<VoiceMemoProps> = ({
  onRecordingComplete,
  onProcessingStatusChange,
  isProcessing = false,
  title = "Voice Memo",
  description = "Record your thoughts and insights",
  placeholder = "Tap to start recording...",
  disabled = false,
  compact = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setRecordingTime(0);
    setError(null);
  };

  const submitRecording = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      onRecordingComplete(audioFile);
      onProcessingStatusChange?.(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          {!audioBlob && !isRecording && (
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<MicIcon />}
                onClick={startRecording}
                disabled={disabled || isProcessing}
                sx={{ borderRadius: 2 }}
              >
                Record
              </Button>
              <Typography variant="body2" color="text.secondary">
                {placeholder}
              </Typography>
            </Box>
          )}

          {isRecording && (
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton
                color="error"
                onClick={stopRecording}
                sx={{ 
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                <StopIcon />
              </IconButton>
              <RecordingIcon color="error" />
              <Typography variant="body2" color="error">
                Recording... {formatTime(recordingTime)}
              </Typography>
            </Box>
          )}

          {audioBlob && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <IconButton
                  size="small"
                  onClick={isPlaying ? pauseAudio : playAudio}
                  disabled={isProcessing}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <Typography variant="body2">
                  Recording ({formatTime(recordingTime)})
                </Typography>
                <IconButton
                  size="small"
                  onClick={deleteRecording}
                  disabled={isProcessing}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={deleteRecording}
                  disabled={isProcessing}
                  size="small"
                >
                  Re-record
                </Button>
                <Button
                  variant="contained"
                  onClick={submitRecording}
                  disabled={isProcessing}
                  startIcon={<SendIcon />}
                  size="small"
                >
                  {isProcessing ? 'Processing...' : 'Submit'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ 
        p: 3, 
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200'
      }}>
        {!audioBlob && !isRecording && (
          <Box textAlign="center">
            <Button
              variant="contained"
              color="primary"
              startIcon={<MicIcon />}
              onClick={startRecording}
              disabled={disabled || isProcessing}
              size="large"
              sx={{ 
                borderRadius: 3,
                py: 1.5,
                px: 3,
                mb: 2
              }}
            >
              Start Recording
            </Button>
            <Typography variant="body2" color="text.secondary">
              {placeholder}
            </Typography>
          </Box>
        )}

        {isRecording && (
          <Box textAlign="center">
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
              <RecordingIcon 
                color="error" 
                sx={{ 
                  fontSize: 32,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              />
              <Typography variant="h6" color="error">
                Recording... {formatTime(recordingTime)}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              size="large"
              sx={{ borderRadius: 3 }}
            >
              Stop Recording
            </Button>
          </Box>
        )}

        {audioBlob && (
          <Box>
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
              <IconButton
                color="primary"
                onClick={isPlaying ? pauseAudio : playAudio}
                disabled={isProcessing}
                size="large"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              <Typography variant="body1">
                Recording ready ({formatTime(recordingTime)})
              </Typography>
              <Chip label="Ready to submit" color="success" size="small" />
            </Box>
            
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={deleteRecording}
                disabled={isProcessing}
                startIcon={<DeleteIcon />}
              >
                Delete & Re-record
              </Button>
              <Button
                variant="contained"
                onClick={submitRecording}
                disabled={isProcessing}
                startIcon={isProcessing ? undefined : <SendIcon />}
                size="large"
                sx={{ borderRadius: 3 }}
              >
                {isProcessing ? 'Processing...' : 'Submit Recording'}
              </Button>
            </Box>
            
            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Processing your recording...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
    </Box>
  );
}; 