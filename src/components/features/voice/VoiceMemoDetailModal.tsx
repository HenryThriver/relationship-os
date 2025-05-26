/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import { VoiceMemoArtifact } from '@/types'; // Assuming VoiceMemoArtifact is comprehensive

interface VoiceMemoDetailModalProps {
  open: boolean;
  onClose: () => void;
  voiceMemo: VoiceMemoArtifact | null;
  playAudio: (audioFilePath: string) => Promise<string | undefined>; // Returns playable URL or undefined
  onDelete: (artifact_id: string) => Promise<void>;
  onReprocess: (artifact_id: string) => Promise<void>;
  isLoading?: boolean; // General loading state for modal actions
  isDeleting?: boolean; // Specific loading state for delete
  isReprocessing?: boolean; // Specific loading state for reprocess
  audioPlaybackError?: string | null;
  currentPlayingUrl?: string | null; // URL of the audio currently playing/loaded
}

export const VoiceMemoDetailModal: React.FC<VoiceMemoDetailModalProps> = ({
  open,
  onClose,
  voiceMemo,
  playAudio,
  onDelete,
  onReprocess,
  isLoading = false, // Default general loading
  isDeleting = false,
  isReprocessing = false,
  audioPlaybackError,
  currentPlayingUrl,
}) => {
  const [internalAudioUrl, setInternalAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  if (!voiceMemo) return null;

  const handlePlayAudio = async () => {
    if (!voiceMemo.audio_file_path) {
      setAudioError('Audio file path is missing.');
      return;
    }
    setAudioError(null);
    setIsPlaying(true);
    try {
      const url = await playAudio(voiceMemo.audio_file_path);
      if (url) {
        setInternalAudioUrl(url);
      } else {
        setAudioError('Could not load audio for playback.');
      }
    } catch (e: any) {
      setAudioError(e.message || 'Error playing audio.');
    } finally {
      // setIsPlaying(false); // Don't set to false immediately, audio element handles playback state
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this voice memo? This action cannot be undone.')) {
      onDelete(voiceMemo.id);
    }
  };

  const handleReprocess = () => {
    onReprocess(voiceMemo.id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Voice Memo Details
        <Typography variant="caption" display="block">
          Recorded: {new Date(voiceMemo.created_at).toLocaleString()} - Duration: {voiceMemo.duration_seconds ? `${voiceMemo.duration_seconds}s` : 'N/A'}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Transcription</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', p:1, border: '1px solid #eee', borderRadius: '4px'}}>
            {voiceMemo.transcription || voiceMemo.content || 'No transcription available.'}
          </Typography>
        </Box>

        {voiceMemo.audio_file_path && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2}}>
            <Button 
              variant="outlined" 
              startIcon={<PlayArrowIcon />} 
              onClick={handlePlayAudio} 
              disabled={isReprocessing || isDeleting || isPlaying}
            >
              Play Memo
            </Button>
            {isPlaying && !internalAudioUrl && <CircularProgress size={20} />}
          </Box>
        )}

        {internalAudioUrl && (
          <Box mt={1} mb={2}>
            <audio 
              controls 
              autoPlay 
              src={internalAudioUrl} 
              onEnded={() => { setIsPlaying(false); setInternalAudioUrl(null); }} 
              onError={() => { 
                setAudioError('Error playing audio. Please try again.'); 
                setIsPlaying(false); 
                setInternalAudioUrl(null); 
              }}
            >
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}
        {(audioError || audioPlaybackError) && <Alert severity="error" sx={{mt: 1}}>{audioError || audioPlaybackError}</Alert>}

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>Actions</Typography>
          <Box sx={{display: 'flex', gap: 1}}>
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<ReplayIcon />} 
              onClick={handleReprocess}
              disabled={isReprocessing || isDeleting || voiceMemo.transcription_status !== 'completed'}
            >
              {isReprocessing ? <CircularProgress size={20} sx={{mr:1}}/> : null}
              Reprocess AI
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDelete}
              disabled={isReprocessing || isDeleting}
            >
              {isDeleting ? <CircularProgress size={20} sx={{mr:1}}/> : null}
              Delete Memo
            </Button>
          </Box>
          {voiceMemo.transcription_status !== 'completed' && 
            <Alert severity='info' sx={{mt:1}}>AI Reprocessing is only available after transcription is complete.</Alert> }
        </Box>

      </DialogContent>

      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={isDeleting || isReprocessing}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 