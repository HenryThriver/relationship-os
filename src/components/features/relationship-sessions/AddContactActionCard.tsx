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
  Chip,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Check as CheckIcon,
  SkipNext as SkipIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useCompleteSessionAction } from '@/lib/hooks/useRelationshipSessions';
import { VoiceMemo } from '@/components/ui/VoiceMemo';

interface AddContactActionCardProps {
  actionId: string;
  goalId: string;
  goalTitle: string;
  currentCount: number;
  targetCount: number;
  onComplete: (actionId: string) => void;
  onSkip: (actionId: string) => void;
}

export const AddContactActionCard: React.FC<AddContactActionCardProps> = ({
  actionId,
  goalId,
  goalTitle,
  currentCount,
  targetCount,
  onComplete,
  onSkip,
}) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [email, setEmail] = useState('');
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [voiceMemo, setVoiceMemo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'linkedin' | 'voice' | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  
  const completeAction = useCompleteSessionAction();
  
  const addContact = useMutation({
    mutationFn: async (data: { linkedinUrl?: string; email?: string; additionalEmails?: string[]; voiceMemo?: File }) => {
      if (data.linkedinUrl) {
        // LinkedIn submission
        if (!data.linkedinUrl.includes('linkedin.com')) {
          throw new Error('Please provide a valid LinkedIn URL');
        }
        
        const allEmails = [data.email?.trim(), ...additionalEmails].filter(e => e && e.length > 0);
        
        const response = await fetch('/api/contacts/goal-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkedin_urls: [data.linkedinUrl],
            goal_id: goalId,
            include_email_sync: !!data.email,
            email_address: data.email || undefined,
            additional_emails: allEmails.length > 1 ? allEmails : undefined
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to import contact: ${errorText}`);
        }
        
        return response.json();
      } else if (data.voiceMemo) {
        // Voice memo submission
        const formData = new FormData();
        formData.append('audio_file', data.voiceMemo);
        formData.append('memo_type', 'profile_enhancement');
        formData.append('goal_id', goalId);
        formData.append('context', 'relationship_session');

        const response = await fetch('/api/voice-memo/onboarding', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process voice memo');
        }

        return response.json();
      } else {
        throw new Error('Please provide either a LinkedIn URL or voice memo');
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
          imported_contacts: data.imported_contacts || [],
          linkedin_url: linkedinUrl || null,
          email: email || null,
          voice_memo_id: data.artifact_id || null,
          goal_id: goalId,
          method: submissionMethod || 'unknown'
        }
      });
      
      // Delay to show success state
      setTimeout(() => {
        onComplete(actionId);
      }, 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      setSuccess(false);
    }
  });

  const progress = Math.min((currentCount / targetCount) * 100, 100);
  const isLoading = addContact.isPending || isVoiceProcessing || completeAction.isPending;

  const handleAddEmail = () => {
    if (newEmail.trim() && !additionalEmails.includes(newEmail.trim()) && newEmail.trim() !== email.trim()) {
      setAdditionalEmails([...additionalEmails, newEmail.trim()]);
      setNewEmail('');
    }
  };

  const handleLinkedInSubmit = () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }
    
    setError(null);
    setSubmissionMethod('linkedin');
    
    const allEmails = [email.trim(), ...additionalEmails].filter(e => e.length > 0);
    
    addContact.mutate({ 
      linkedinUrl: linkedinUrl.trim(), 
      email: email.trim() || undefined,
      additionalEmails: allEmails.length > 1 ? allEmails : undefined
    });
  };

  const handleVoiceRecordingComplete = (audioFile: File) => {
    setVoiceMemo(audioFile);
    setSubmissionMethod('voice');
    setIsVoiceProcessing(true);
    
    addContact.mutate({ voiceMemo: audioFile });
  };

  const handleSkip = async () => {
    await completeAction.mutateAsync({
      actionId,
      status: 'skipped',
      actionData: { goal_id: goalId }
    });
    onSkip(actionId);
  };

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
            🎉 Perfect!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
            Contact Added Successfully
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
            {submissionMethod === 'linkedin' 
              ? 'Your LinkedIn contact is being processed and meaningful artifacts are being created. This will strengthen your professional network and help you achieve your goal!'
              : 'Your voice memo is being processed to extract contact information and create valuable artifacts. Our AI will help you build stronger relationships!'
            }
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
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
        color: 'white',
        position: 'relative'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PersonAddIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Add Contact
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Expand your network • {currentCount}/{targetCount} contacts
              </Typography>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={handleSkip} 
            disabled={isLoading}
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #43a047 0%, #66bb6a 100%)'
              }
            }}
          />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            {Math.round(progress)}% of target network achieved
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* LinkedIn Profile Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <LinkedInIcon sx={{ color: '#0077B5', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              LinkedIn Profile
            </Typography>
          </Box>
          
          <TextField
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            fullWidth
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkedInIcon sx={{ color: '#0077B5' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        {/* Email Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <EmailIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Email Addresses
            </Typography>
            <Chip label="Optional" size="small" variant="outlined" />
          </Box>
          
          <TextField
            label="Primary Email Address"
            placeholder="contact@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Additional Emails */}
          {additionalEmails.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Additional Emails:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {additionalEmails.map((additionalEmail, index) => (
                  <Chip
                    key={index}
                    label={additionalEmail}
                    onDelete={() => {
                      setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
                    }}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Add Additional Email */}
          <Box display="flex" gap={1} sx={{ mb: 2 }}>
            <TextField
              label="Add another email"
              placeholder="personal@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              size="small"
              disabled={isLoading}
              sx={{ flex: 1 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={handleAddEmail}
              disabled={isLoading || !newEmail.trim()}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              +
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            💡 <strong>Add all email addresses:</strong> All emails and meetings with those emails will be synced.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Voice Memo Section */}
        <VoiceMemo
          title="Voice Description (Optional)"
          description="Tell us about this contact - their role, how you know them, what you'd like to achieve together."
          placeholder="Describe your contact and relationship goals..."
          onRecordingComplete={handleVoiceRecordingComplete}
          onProcessingStatusChange={setIsVoiceProcessing}
          isProcessing={isVoiceProcessing}
          disabled={isLoading}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          You can add the contact via <strong>LinkedIn URL</strong> or <strong>voice description</strong> - or both!
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleSkip}
          disabled={isLoading}
          startIcon={<SkipIcon />}
          sx={{ borderRadius: 2 }}
        >
          Skip This Contact
        </Button>
        
        <Button
          variant="contained"
          onClick={handleLinkedInSubmit}
          disabled={isLoading || !linkedinUrl.trim()}
          startIcon={<SendIcon />}
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
          {isLoading ? 'Processing...' : 'Add Contact'}
        </Button>
      </CardActions>
    </Card>
  );
}; 