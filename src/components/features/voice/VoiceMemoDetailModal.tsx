/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/lib/contexts/ToastContext'; // Added import
import { ProcessingIndicator } from '@/components/features/voice/ProcessingIndicator'; // Import ProcessingIndicator
import { ProcessingStatus as VoiceMemoProcessingStatus } from '@/lib/hooks/useVoiceMemos'; // Import status type

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
  processingStatus?: VoiceMemoProcessingStatus['status']; // Pass the computed status string
  processingStartTime?: string | null; // Pass the start time for the timer
  contactName?: string; // Optional for context
}

export const VoiceMemoDetailModal: React.FC<VoiceMemoDetailModalProps> = ({
  open,
  onClose,
  voiceMemo,
  playAudio,
  onDelete,
  onReprocess,
  // isLoading = false, // Consider removing if not used or handled by specific flags
  isDeleting = false,
  // isReprocessing: initialIsReprocessing = false, // Renamed to avoid conflict with internal state
  audioPlaybackError,
  currentPlayingUrl,
  processingStatus,
  processingStartTime,
  contactName,
}) => {
  const { showToast } = useToast(); // Added useToast hook
  const [internalAudioUrl, setInternalAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  // Internal state for reprocessing to manage button and toast logic
  const [isReprocessingInternal, setIsReprocessingInternal] = useState(false); 

  // Sync internal reprocessing state if an external prop is provided and changes
  // This might be overly complex if isReprocessing is purely driven by the button click within modal
  // useEffect(() => {
  //   setIsReprocessingInternal(initialIsReprocessing);
  // }, [initialIsReprocessing]);

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

  const handleDelete = async () => { // Made async to potentially await onDelete
    if (window.confirm('Are you sure you want to delete this voice memo? This action cannot be undone.')) {
      // Consider adding try-catch for onDelete and showing toast
      try {
        await onDelete(voiceMemo.id);
        showToast('Voice memo deleted.', 'info');
        onClose(); // Close modal on successful delete
      } catch (error: any) {
        console.error('Error deleting voice memo:', error);
        showToast('Failed to delete voice memo.', 'error');
      }
    }
  };

  const handleReprocess = async () => { // Made async to match user prompt
    if (!voiceMemo) return;
    setIsReprocessingInternal(true);
    setAudioError(null); // Clear previous audio errors if any
    // If setAudioPlaybackError is passed as a prop, use it:
    // setAudioPlaybackError?.(null);

    try {
      // Show immediate feedback toast
      showToast("AI reprocessing started", "info", { 
        icon: "⚡", // This will be a string, ensure ToastItem handles string icons or use MUI icons
        duration: 4000 
      });
      
      await onReprocess(voiceMemo.id);
      
      // Optional: show success toast, though the user prompt implies a different mechanism for completion
      // showToast("Reprocessing request sent", "success"); 

      // Brief delay to show feedback before closing
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error reprocessing AI:', error);
      // Set local audioError or use a prop if it's for a shared Alert component
      setAudioError(error.message || 'Error reprocessing AI.'); 
      showToast("Reprocessing failed", "error", {
        icon: "⚠️", // String icon
        duration: 6000
      });
    } finally {
      setIsReprocessingInternal(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Voice Memo Details
        <Typography variant="caption" display="block">
          Recorded: {new Date(voiceMemo.created_at).toLocaleString()} - Duration: {voiceMemo.duration_seconds ? `${voiceMemo.duration_seconds}s` : 'N/A'}
        </Typography>
        {processingStatus && (
          <Box sx={{ mt: 1 }}>
            <ProcessingIndicator 
              status={processingStatus}
              startTime={processingStartTime || undefined}
              showTimer={processingStatus === 'processing'}
              compact={false} // Non-compact version for modal
              message={processingStatus === 'completed' ? 'Analysis Complete' : processingStatus === 'failed' ? 'Analysis Failed' : processingStatus === 'processing' ? `Processing (for ${contactName || 'contact'})...` : 'Pending Analysis'}
            />
          </Box>
        )}
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
              disabled={isReprocessingInternal || isDeleting || isPlaying}
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
              disabled={isReprocessingInternal || isDeleting || voiceMemo.transcription_status !== 'completed'}
            >
              {isReprocessingInternal ? <CircularProgress size={20} sx={{mr:1}}/> : null}
              Reprocess AI
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDelete} // Changed to async handleDelete
              disabled={isReprocessingInternal || isDeleting}
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
        <Button onClick={onClose} disabled={isDeleting || isReprocessingInternal}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 