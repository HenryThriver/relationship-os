'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Box,
  LinearProgress,
  Alert,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Avatar,
} from '@mui/material';
import {
  NoteAdd as NoteAddIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Check as CheckIcon,
  SkipNext as SkipIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useCompleteSessionAction } from '@/lib/hooks/useRelationshipSessions';
import { VoiceMemo } from '@/components/ui/VoiceMemo';
import { format } from 'date-fns';
import type { MeetingArtifactContent } from '@/types/artifact';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meeting-notes-tabpanel-${index}`}
      aria-labelledby={`meeting-notes-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface AddMeetingNotesActionCardProps {
  actionId: string;
  meetingArtifactId: string;
  contactId: string;
  contactName: string;
  contactProfilePicture?: string | null;
  meetingTitle: string;
  meetingMetadata: MeetingArtifactContent;
  onComplete: (actionId: string) => void;
  onSkip: (actionId: string) => void;
}

export const AddMeetingNotesActionCard: React.FC<AddMeetingNotesActionCardProps> = ({
  actionId,
  meetingArtifactId,
  contactId,
  contactName,
  contactProfilePicture,
  meetingTitle,
  meetingMetadata,
  onComplete,
  onSkip,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [voiceMemo, setVoiceMemo] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  
  const completeAction = useCompleteSessionAction();
  
  const saveMeetingContent = useMutation({
    mutationFn: async (data: { 
      contentType: 'notes' | 'transcript' | 'voice_memo' | 'recording';
      content: string | File;
    }) => {
      if ((data.contentType === 'voice_memo' || data.contentType === 'recording') && data.content instanceof File) {
        // Handle voice memo or recording file submission
        const formData = new FormData();
        formData.append('audio_file', data.content);
        formData.append('memo_type', 'meeting_notes');
        formData.append('meeting_artifact_id', meetingArtifactId);
        formData.append('contact_id', contactId);
        formData.append('context', 'relationship_session');

        const response = await fetch('/api/voice-memo/onboarding', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process audio file');
        }

        return response.json();
      } else {
        // Handle text-based content
        const formData = new FormData();
        formData.append('contentType', data.contentType);
        formData.append('meetingArtifactId', meetingArtifactId);
        
        if (typeof data.content === 'string') {
          formData.append('content', data.content);
        }
        
        const response = await fetch('/api/meetings/add-content', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save meeting content: ${errorText}`);
        }
        
        return response.json();
      }
    },
    onSuccess: async (data) => {
      setSuccess(true);
      setError(null);
      
      // Mark action as completed
      await completeAction.mutateAsync({
        actionId,
        status: 'completed',
        actionData: {
          meeting_artifact_id: meetingArtifactId,
          content_type: activeTab === 0 ? 'voice_memo' : activeTab === 1 ? 'notes' : activeTab === 2 ? 'recording' : 'transcript',
          content_length: activeTab === 0 ? voiceMemo?.size || 0 : activeTab === 1 ? notes.length : activeTab === 2 ? selectedFile?.size || 0 : transcript.length,
          contact_id: contactId,
          voice_memo_id: data.artifact_id || null
        }
      });
      
      // Delay to show success state
      setTimeout(() => {
        onComplete(actionId);
      }, 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to save meeting content');
      setSuccess(false);
      setIsVoiceProcessing(false);
    }
  });
  
  const handleSubmit = () => {
    let contentType: 'notes' | 'transcript' | 'voice_memo' | 'recording';
    let content: string | File;
    
    switch (activeTab) {
      case 0: // Voice Memo
        if (!voiceMemo) {
          setError('Please record a voice memo');
          return;
        }
        contentType = 'voice_memo';
        content = voiceMemo;
        break;
      case 1: // Notes
        if (!notes.trim()) {
          setError('Please enter some notes');
          return;
        }
        contentType = 'notes';
        content = notes.trim();
        break;
      case 2: // Recording Upload
        if (!selectedFile) {
          setError('Please select a recording file');
          return;
        }
        contentType = 'recording';
        content = selectedFile;
        break;
      case 3: // Transcript
        if (!transcript.trim()) {
          setError('Please enter a transcript');
          return;
        }
        contentType = 'transcript';
        content = transcript.trim();
        break;
      default:
        return;
    }
    
    setError(null);
    saveMeetingContent.mutate({ contentType, content });
  };
  
  const handleVoiceRecordingComplete = (audioFile: File) => {
    setVoiceMemo(audioFile);
    setIsVoiceProcessing(true);
    
    // Auto-submit the voice memo
    saveMeetingContent.mutate({ 
      contentType: 'voice_memo', 
      content: audioFile 
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'audio/webm'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid audio or video file');
        return;
      }
      
      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

    const handleFileUploadSubmit = () => {
    if (!selectedFile) {
      setError('Please select a recording file');
      return;
    }
    
    setError(null);
    setIsVoiceProcessing(true);
    saveMeetingContent.mutate({ 
      contentType: 'recording', 
      content: selectedFile 
    });
  };
    
  const handleSkip = async () => {
    await completeAction.mutateAsync({
      actionId,
      status: 'skipped',
      actionData: { skipped_reason: 'user_choice' }
    });
    onSkip(actionId);
  };
  
  const formatDateTime = (metadata: MeetingArtifactContent) => {
    try {
      // Check for meeting_date in metadata (Google Calendar format)
      if (metadata.meeting_date) {
        const startDate = new Date(metadata.meeting_date);
        let timeDisplay = format(startDate, 'MMM d, yyyy \'at\' h:mm a');
        
        // Add end time if we have duration
        if (metadata.duration_minutes) {
          const endDate = new Date(startDate.getTime() + metadata.duration_minutes * 60000);
          timeDisplay += ` - ${format(endDate, 'h:mm a')}`;
        }
        
        return timeDisplay;
      }
      
      // Fallback to startTime if available
      if (metadata.startTime) {
        const startDate = new Date(metadata.startTime);
        let timeDisplay = format(startDate, 'MMM d, yyyy \'at\' h:mm a');
        
        if (metadata.endTime) {
          const endDate = new Date(metadata.endTime);
          timeDisplay += ` - ${format(endDate, 'h:mm a')}`;
        }
        
        return timeDisplay;
      }
      
      return 'Recent';
    } catch {
      return 'Recent';
    }
  };
  
  const isLoading = saveMeetingContent.isPending || completeAction.isPending;
  
  if (success) {
    return (
      <Card sx={{ 
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%)',
        border: '2px solid',
        borderColor: 'success.main',
        borderRadius: 4,
        boxShadow: '0 12px 40px rgba(76, 175, 80, 0.25)',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <CheckIcon 
            sx={{ 
              fontSize: 80, 
              color: 'success.main', 
              mb: 2,
              filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
            }} 
          />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 2 }}>
            🎉 Excellent!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
            Meeting Notes Added Successfully
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
            Your meeting content is being processed and insights will be generated to help strengthen your relationship with {contactName}.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: 4,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(33, 150, 243, 0.12)',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <NoteAddIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Add Meeting Notes
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleSkip} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Meeting Info */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar 
              src={contactProfilePicture || undefined}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
            >
              {!contactProfilePicture && <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {contactName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {meetingTitle}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(meetingMetadata)}
            </Typography>
          </Box>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Content Type Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 1.5,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          <Tab 
            icon={<MicIcon />} 
            label="Voice Memo"
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'medium',
              minHeight: 48
            }}
          />
          <Tab 
            icon={<NoteAddIcon />} 
            label="Notes"
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'medium',
              minHeight: 48
            }}
          />
          <Tab 
            icon={<CloudUploadIcon />} 
            label="Upload Recording"
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'medium',
              minHeight: 48
            }}
          />
          <Tab 
            icon={<RecordVoiceOverIcon />} 
            label="Transcript"
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'medium',
              minHeight: 48
            }}
          />
        </Tabs>
        
        {/* Content Input */}
        <TabPanel value={activeTab} index={0}>
          <VoiceMemo
            title="Voice Memo"
            description="Record your thoughts about the meeting - key insights, follow-ups, relationship notes."
            placeholder="Record your meeting insights..."
            onRecordingComplete={handleVoiceRecordingComplete}
            onProcessingStatusChange={setIsVoiceProcessing}
            isProcessing={isVoiceProcessing}
            disabled={isLoading}
            compact={false}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <TextField
            label="Meeting Notes"
            placeholder="What was discussed? Key takeaways, decisions, action items..."
            multiline
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            disabled={isLoading}
            helperText="Add your notes about the meeting discussion"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Box>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              style={{ display: 'none' }}
              id="recording-upload"
            />
            <label htmlFor="recording-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={isLoading}
                fullWidth
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  py: 2
                }}
              >
                Select Recording File
              </Button>
            </label>
            
            {selectedFile && (
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Selected: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {Math.round(selectedFile.size / 1024 / 1024 * 100) / 100} MB
                </Typography>
              </Paper>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Upload an audio or video recording of the meeting (max 100MB). 
              It will be automatically transcribed and processed for insights.
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <TextField
            label="Meeting Transcript"
            placeholder="Paste the meeting transcript here..."
            multiline
            rows={6}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            fullWidth
            disabled={isLoading}
            helperText="Paste a transcript of the meeting conversation"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </TabPanel>
        
        {/* Loading Progress */}
        {isLoading && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {saveMeetingContent.isPending ? 'Processing meeting content...' : 'Completing action...'}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ px: 4, pb: 4, pt: 0, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleSkip}
          disabled={isLoading}
          startIcon={<SkipIcon />}
          sx={{ borderRadius: 2 }}
        >
          Skip
        </Button>
        
        {/* Show submit button for Notes, Recording, and Transcript tabs (Voice Memo auto-submits) */}
        {activeTab > 0 && (
          <Button
            variant="contained"
            onClick={activeTab === 2 ? handleFileUploadSubmit : handleSubmit}
            disabled={isLoading || 
              (activeTab === 1 && !notes.trim()) || 
              (activeTab === 2 && !selectedFile) || 
              (activeTab === 3 && !transcript.trim())
            }
            startIcon={activeTab === 2 ? <CloudUploadIcon /> : <NoteAddIcon />}
            size="large"
            sx={{ 
              borderRadius: 3,
              px: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            {isLoading ? 'Processing...' : 
             activeTab === 1 ? 'Save Notes' :
             activeTab === 2 ? 'Upload Recording' :
             'Save Transcript'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}; 