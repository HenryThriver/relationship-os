'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Card,
  CardContent,
  Alert,
  Fade,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  LinkedIn, 
  CheckCircle,
  Help,
  NavigateBefore,
  NavigateNext,
  Settings
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';
import { PremiumCard, ExecutiveButton } from '@/components/ui/premium';

interface ContactInput {
  id: string;
  url: string;
  isValid: boolean;
  error?: string;
}

export default function ContactImportScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  const { profile } = useUserProfile();
  const theme = useTheme();
  
  const [animationStep, setAnimationStep] = useState(0);
  const [contact, setContact] = useState<ContactInput>({
    id: '1', 
    url: '', 
    isValid: false
  });
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [voiceMemoProcessing, setVoiceMemoProcessing] = useState(false);
  const [contactVoiceMemoId, setContactVoiceMemoId] = useState<string | null>(null);

  // Navigation state for debugging
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const startAnimationSequence = () => {
      // Step 1: Show goal acknowledgment
      setAnimationStep(1);
      
      // Step 2: Show instruction message  
      setTimeout(() => setAnimationStep(2), 3000);
      
      // Step 3: Show input form
      setTimeout(() => setAnimationStep(3), 4500);
    };

    // Start animation sequence after brief delay
    const timeoutId = setTimeout(startAnimationSequence, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const linkedinUrlPattern = /linkedin\.com\/in\/[^\/\?\s]+/i;
    return linkedinUrlPattern.test(url);
  };

  const updateContact = (url: string) => {
    const newContact = {
      ...contact,
      url: url.trim(),
      isValid: validateLinkedInUrl(url.trim()),
      error: url.trim() && !validateLinkedInUrl(url.trim()) ? 'Please enter a valid LinkedIn profile URL' : undefined
    };
    setContact(newContact);
    
    // Show voice recorder when valid LinkedIn URL is entered
    if (newContact.isValid && !showVoiceRecorder) {
      setShowVoiceRecorder(true);
    } else if (!newContact.isValid && showVoiceRecorder) {
      setShowVoiceRecorder(false);
    }
  };

  const handleVoiceRecordingComplete = async (audioFile: File) => {
    setVoiceMemoProcessing(true);
    setError('');

    try {
      // Create FormData for the voice memo upload
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('memo_type', 'profile_enhancement');
      formData.append('linkedin_url', contact.url);

      // Upload and process the voice memo
      const response = await fetch('/api/voice-memo/onboarding', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process voice memo');
      }

      const result = await response.json();
      
      if (result.success) {
        setContactVoiceMemoId(result.artifact_id);
        
        console.log('Contact voice memo processing:', {
          artifact_id: result.artifact_id,
          linkedin_url: contact.url,
          memo_type: 'profile_enhancement'
        });
      } else {
        throw new Error('Voice memo processing failed');
      }
    } catch (err) {
      console.error('Error processing contact voice memo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your voice memo. Please try again.');
    } finally {
      setVoiceMemoProcessing(false);
    }
  };

  const handleAnalyzeContact = async () => {
    if (!contact.isValid) {
      setError('Please add a valid LinkedIn profile URL');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Store the LinkedIn URL and voice memo ID in onboarding state
      await updateState({
        goal_contact_urls: [contact.url],
        profile_enhancement_voice_memo_id: contactVoiceMemoId ?? undefined
      });

      // Import contact via API for immediate processing
      const response = await fetch('/api/contacts/goal-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedin_urls: [contact.url],
          voice_memo_id: contactVoiceMemoId
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to import contact');
      }

      // Store imported contact data for confirmation screen
      await updateState({
        imported_goal_contacts: result.contacts
      });

      console.log('Goal contact imported:', {
        url: contact.url,
        voice_memo_id: contactVoiceMemoId,
        contact: result.contacts[0],
        goal: profile?.primary_goal
      });
      
      // Mark this screen as complete
      await completeScreen(currentScreen);
      
      // Move to next screen
      await nextScreen();
      
    } catch (err) {
      console.error('Error importing goal contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to import contact. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isNavigating || isProcessing || voiceMemoProcessing;
  const canProceed = contact.isValid && contactVoiceMemoId;

  const suggestionTooltip = (
    <Box sx={{ p: 2, maxWidth: 300 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        Need suggestions? Think about:
      </Typography>
      <Box component="ul" sx={{ pl: 2, mb: 0 }}>
        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
          Someone who&apos;s achieved what you want
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
          Someone in your target industry/company
        </Typography>
        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
          Someone who could make introductions
        </Typography>
        <Typography component="li" variant="body2">
          A mentor, advisor, or industry expert
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      px: 3,
      pb: 4
    }}>
      {/* Debug Navigation Controls */}
      {debugMode && (
        <Box sx={{ 
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 1000,
          backgroundColor: 'white',
          p: 2,
          borderRadius: 2,
          boxShadow: 3,
          border: '1px solid #ddd'
        }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Step: {animationStep}/3
            </Typography>
            <Button
              size="small"
              onClick={() => setAnimationStep(Math.max(0, animationStep - 1))}
              disabled={animationStep <= 1}
            >
              <NavigateBefore />
            </Button>
            <Button
              size="small"
              onClick={() => setAnimationStep(Math.min(3, animationStep + 1))}
              disabled={animationStep >= 3}
            >
              <NavigateNext />
            </Button>
          </Stack>
        </Box>
      )}

      {/* Debug Toggle */}
      <Box sx={{ 
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000
      }}>
        <IconButton
          onClick={() => setDebugMode(!debugMode)}
          sx={{ 
            backgroundColor: debugMode ? 'primary.main' : 'rgba(0, 0, 0, 0.04)',
            color: debugMode ? 'white' : 'text.secondary',
            '&:hover': {
              backgroundColor: debugMode ? 'primary.dark' : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <Settings />
        </IconButton>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto', minHeight: 120 }}>
        
        {/* Step 1: Goal Acknowledgment */}
        {animationStep >= 1 && (
          <Fade in={true} timeout={1000}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  mb: 3
                }}
              >
                Perfect! Here&apos;s your goal:
              </Typography>

              {profile?.primary_goal && (
                <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f0f9ff' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '1.5rem' }}>🎯</Typography>
                      <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                        {profile.primary_goal}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Fade>
        )}

        {/* Step 2: Instructions */}
        {animationStep >= 2 && (
          <Fade in={true} timeout={1000}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography 
                variant="h5" 
                color="text.primary" 
                sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.4,
                  mb: 4
                }}
              >
                Now let&apos;s identify key stakeholders in your success trajectory
              </Typography>

              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  maxWidth: 600,
                  mx: 'auto',
                  fontSize: '1.1rem'
                }}
              >
                Think strategically—who could accelerate your path, open doors, 
                or provide critical insights? We&apos;ll uncover non-obvious connections.
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Step 3: Contact Input Form */}
        {animationStep >= 3 && (
          <Fade in={true} timeout={1000}>
            <Box>
              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Contact Input Field */}
              <PremiumCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Strategic Connection Profile
                  </Typography>
                  <Tooltip title={suggestionTooltip} arrow placement="top">
                    <IconButton size="small" sx={{ color: theme.palette.sage.main }}>
                      <Help />
                    </IconButton>
                  </Tooltip>
                </Box>
                  
                  <TextField
                    fullWidth
                    label="LinkedIn Profile URL"
                    placeholder="linkedin.com/in/strategic-connection"
                    value={contact.url}
                    onChange={(e) => updateContact(e.target.value)}
                    error={!!contact.error}
                    helperText={contact.error || "We'll analyze their professional presence and identify collaboration opportunities"}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkedIn sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: contact.isValid ? (
                        <InputAdornment position="end">
                          <CheckCircle sx={{ color: theme.palette.sage.main }} />
                        </InputAdornment>
                      ) : null
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.sage.main,
                          }
                        }
                      }
                    }}
                  />
                </PremiumCard>

              {/* Voice Memo Section */}
              {showVoiceRecorder && (
                <Fade in={true} timeout={1000}>
                  <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                    <CardContent sx={{ p: 4 }}>
                      <OnboardingVoiceRecorder
                        memoType="profile_enhancement"
                        onRecordingComplete={handleVoiceRecordingComplete}
                        title="Share more about this contact"
                        description="Tell us a little bit about how you know this contact (if at all) and why you added them. How are they relevant to your goal?"
                        isProcessing={voiceMemoProcessing}
                        disabled={isLoading}
                      />
                      
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Action Button */}
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <ExecutiveButton
                  variant="contained"
                  size="large"
                  onClick={handleAnalyzeContact}
                  disabled={!canProceed || isLoading}
                >
                  {isLoading ? 'Discovering strategic intelligence...' : 'Analyze strategic value'}
                </ExecutiveButton>
                
                {contact.isValid && !contactVoiceMemoId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Please record a voice memo about this contact to continue
                  </Typography>
                )}
              </Box>

              {/* Steve Jobs Quote */}
              <Box sx={{ 
                textAlign: 'center',
                borderTop: '1px solid #e0e0e0',
                pt: 4
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontStyle: 'italic',
                    color: '#666',
                    lineHeight: 1.6,
                    maxWidth: 600,
                    mx: 'auto'
                  }}
                >
                  &quot;Great things in business are never done by one person. They&apos;re done by a team of people.&quot;
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#999',
                    mt: 1,
                    display: 'block',
                    letterSpacing: '0.5px'
                  }}
                >
                  — Steve Jobs
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
} 