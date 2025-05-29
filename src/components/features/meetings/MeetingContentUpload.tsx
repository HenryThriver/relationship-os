'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  NoteAdd as NoteAddIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { MeetingArtifact, MeetingArtifactContent } from '@/types/artifact';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meeting-content-tabpanel-${index}`}
      aria-labelledby={`meeting-content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface MeetingContentUploadProps {
  open: boolean;
  onClose: () => void;
  meeting: MeetingArtifact;
  onSave: (contentType: 'notes' | 'transcript' | 'recording', content: string | File) => Promise<void>;
  processing?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export const MeetingContentUpload: React.FC<MeetingContentUploadProps> = ({
  open,
  onClose,
  meeting,
  onSave,
  processing = false,
  processingStatus,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meetingContent = meeting.content as MeetingArtifactContent;
  const meetingDate = meetingContent.startTime ? new Date(meetingContent.startTime) : new Date(meeting.timestamp);

  // Initialize with existing content
  React.useEffect(() => {
    if (open) {
      setNotes(meetingContent.notes || '');
      setTranscript(meetingContent.transcript || '');
      setSelectedFile(null);
      setError(null);
    }
  }, [open, meetingContent]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (audio/video files)
      const validTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid audio or video file (MP3, WAV, M4A, MP4, MOV, etc.)');
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      setError(null);

      let contentType: 'notes' | 'transcript' | 'recording';
      let content: string | File;

      switch (activeTab) {
        case 0: // Notes
          if (!notes.trim()) {
            setError('Please enter some notes');
            return;
          }
          contentType = 'notes';
          content = notes.trim();
          break;
        case 1: // Transcript
          if (!transcript.trim()) {
            setError('Please enter a transcript');
            return;
          }
          contentType = 'transcript';
          content = transcript.trim();
          break;
        case 2: // Recording
          if (!selectedFile) {
            setError('Please select a recording file');
            return;
          }
          contentType = 'recording';
          content = selectedFile;
          break;
        default:
          return;
      }

      await onSave(contentType, content);
      onClose();
    } catch (err) {
      console.error('Error saving meeting content:', err);
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const getProcessingStatusDisplay = () => {
    if (!processingStatus || processingStatus === 'completed') return null;

    const statusConfig = {
      pending: { icon: HourglassEmptyIcon, color: 'info', text: 'Queued for AI processing' },
      processing: { icon: HourglassEmptyIcon, color: 'warning', text: 'AI processing in progress...' },
      failed: { icon: ErrorIcon, color: 'error', text: 'AI processing failed' },
    };

    const config = statusConfig[processingStatus];
    const StatusIcon = config.icon;

    return (
      <Alert 
        severity={config.color as any} 
        icon={<StatusIcon />}
        sx={{ mb: 2 }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">{config.text}</Typography>
          {processingStatus === 'processing' && <LinearProgress sx={{ width: 100, ml: 1 }} />}
        </Box>
      </Alert>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '500px' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Add Meeting Content</Typography>
            <Typography variant="body2" color="text.secondary">
              {meetingContent.title || 'Meeting'} • {format(meetingDate, 'MMM d, yyyy • h:mm a')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {getProcessingStatusDisplay()}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="meeting content tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab 
            icon={<NoteAddIcon />} 
            label="Notes" 
            id="meeting-content-tab-0"
            aria-controls="meeting-content-tabpanel-0"
          />
          <Tab 
            icon={<RecordVoiceOverIcon />} 
            label="Transcript" 
            id="meeting-content-tab-1"
            aria-controls="meeting-content-tabpanel-1"
          />
          <Tab 
            icon={<CloudUploadIcon />} 
            label="Recording" 
            id="meeting-content-tab-2"
            aria-controls="meeting-content-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="subtitle2" gutterBottom>
            Meeting Notes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add your notes from this meeting. AI will analyze them to extract action items and insights.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your meeting notes here..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {meetingContent.notes && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                Current notes:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {meetingContent.notes.substring(0, 200)}
                {meetingContent.notes.length > 200 && '...'}
              </Typography>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle2" gutterBottom>
            Meeting Transcript
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste the transcript of your meeting. AI will analyze it to extract action items and insights.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the meeting transcript here..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {meetingContent.transcript && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                Current transcript:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {meetingContent.transcript.substring(0, 200)}
                {meetingContent.transcript.length > 200 && '...'}
              </Typography>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="subtitle2" gutterBottom>
            Meeting Recording
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload an audio or video recording of your meeting. AI will transcribe it and extract insights.
          </Typography>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*,video/*"
            style={{ display: 'none' }}
          />
          
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 2 }}
          >
            Select Recording File
          </Button>

          {selectedFile && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </Typography>
              </Box>
            </Paper>
          )}

          {meetingContent.recording_url && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                Current recording:
              </Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Recording uploaded</Typography>
              </Box>
            </Paper>
          )}

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="caption" color="text.secondary">
            Supported formats: MP3, WAV, M4A, MP4, MOV, AVI, WebM (max 100MB)
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving || processing}
          startIcon={saving ? <HourglassEmptyIcon /> : undefined}
        >
          {saving ? 'Saving...' : 'Save & Process'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 