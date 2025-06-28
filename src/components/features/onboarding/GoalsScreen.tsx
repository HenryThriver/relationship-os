'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Alert,
  Fade,
  Chip,
  Stack
} from '@mui/material';
import { Flag, SkipNext, Help } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';

const GOAL_CATEGORIES = [
  'Landing a specific role or making a career transition',
  'Growing or launching your startup',
  'Nurturing previous and prospective clients / customers',
  'Finding investors or strategic partners',
  'Breaking into a new industry or market',
  'Learning a new skill or finding a new mentor',
  'Maintain or deepen relationships within an existing community',
  'Something else'
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showUnsureFlow, setShowUnsureFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessConfirmation, setShowSuccessConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string>('');
  const [showContent, setShowContent] = useState(false);

  // Trigger fade-in animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup auto-advance timer on unmount
  React.useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowVoiceRecorder(true);
    setShowUnsureFlow(false);
  };

  const handleUnsureClick = () => {
    setShowUnsureFlow(true);
    setShowVoiceRecorder(false);
    setSelectedCategory('');
  };

  const handleRecordingComplete = async (audioFile: File) => {
    setIsProcessing(true);
    setError('');

    try {
      // Create FormData for the voice memo upload
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('memo_type', 'goal');
      if (selectedCategory) {
        formData.append('goal_category', selectedCategory);
      }

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
        // Update onboarding state with goal voice memo ID
        await updateState({
          goal_voice_memo_id: result.artifact_id
        });

        console.log('Goal voice memo processing:', {
          artifact_id: result.artifact_id,
          category: selectedCategory,
          memo_type: 'goal',
          user_id: user?.id,
          timestamp: new Date().toISOString()
        });

        // Show success feedback before transitioning
        setIsProcessing(false);
        setShowSuccessConfirmation(true);
        setCountdown(10);
        
        // Start countdown and auto-advance
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              handleAdvanceToNextScreen();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setAutoAdvanceTimer(timer);
      } else {
        throw new Error('Voice memo processing failed');
      }
    } catch (err) {
      console.error('Error processing goal voice memo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your voice memo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvanceToNextScreen = async () => {
    try {
      // Clear any active timer
      if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        setAutoAdvanceTimer(null);
      }
      
      await completeScreen(currentScreen);
      await nextScreen();
    } catch (err) {
      console.error('Error advancing to next screen:', err);
      setError('Failed to continue. Please try again.');
    }
  };

  const handleSkipGoals = async () => {
    try {
      await completeScreen(currentScreen);
      await nextScreen();
    } catch (err) {
      console.error('Error skipping goals:', err);
      setError('Failed to continue. Please try again.');
    }
  };

  const isLoading = isNavigating || isProcessing || isLoadingProfile;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      py: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
          
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Flag 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  opacity: 0.9
                }} 
              />
            </Box>
            
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
              Let's personalize your dashboard to what you're actually aspiring to achieve.
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.4,
                mb: 4
              }}
            >
              Which of these is closest to your #1 professional goal for the next 6-12 months?
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                fontStyle: 'italic',
                mb: 4
              }}
            >
              Think about what would genuinely move the needle for you:
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Success Confirmation */}
          {showSuccessConfirmation && (
            <Fade in={showSuccessConfirmation} timeout={600}>
              <Card sx={{ mb: 6, borderRadius: 3, backgroundColor: '#e8f5e8', border: '2px solid #4caf50' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32', fontWeight: 500 }}>
                    🎯 Goal Captured Successfully!
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Perfect! We've recorded your aspirations and are analyzing your voice memo to extract your specific goals, timeline, and success criteria.
                  </Typography>
                  
                  {selectedCategory && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Goal Category:
                      </Typography>
                      <Chip 
                        label={selectedCategory}
                        color="success"
                        sx={{ fontSize: '0.9rem', py: 2, px: 1 }}
                      />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Your dashboard will be personalized based on what you've shared.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          bgcolor: 'success.main', 
                          borderRadius: '50%',
                          animation: 'pulse 1.5s infinite'
                        }} 
                      />
                      <Typography variant="body2" color="success.main">
                        Goals successfully processed!
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleAdvanceToNextScreen}
                        sx={{ 
                          px: 4, 
                          py: 2,
                          borderRadius: 3,
                          fontWeight: 600
                        }}
                      >
                        Continue to Next Step
                      </Button>
                      
                      <Typography variant="body2" color="text.secondary">
                        Auto-advancing in {countdown} seconds
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {!showVoiceRecorder && !showUnsureFlow && !showSuccessConfirmation && (
            <>
              {/* Goal Categories */}
              <Box sx={{ mb: 6 }}>
                <Stack spacing={2}>
                  {GOAL_CATEGORIES.map((category, index) => (
                    <Button
                      key={index}
                      variant={selectedCategory === category ? 'contained' : 'outlined'}
                      onClick={() => handleCategorySelect(category)}
                      disabled={isLoading}
                      sx={{
                        p: 2,
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      {category}
                    </Button>
                  ))}
                </Stack>
              </Box>

              {/* Unsure Button */}
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Button
                  variant="outlined"
                  onClick={handleUnsureClick}
                  disabled={isLoading}
                  startIcon={<Help />}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    color: 'text.secondary',
                    borderColor: 'text.secondary'
                  }}
                >
                  I'm not sure what I'm trying to accomplish
                </Button>
              </Box>
            </>
          )}

          {/* Voice Recorder Section */}
          {showVoiceRecorder && (
            <Fade in={showVoiceRecorder} timeout={600}>
              <Box sx={{ mb: 6 }}>
                {selectedCategory && (
                  <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Selected Goal:
                      </Typography>
                      <Chip 
                        label={selectedCategory}
                        color="primary"
                        sx={{ fontSize: '0.9rem', py: 2, px: 1 }}
                      />
                    </CardContent>
                  </Card>
                )}

                <OnboardingVoiceRecorder
                  memoType="goal"
                  onRecordingComplete={handleRecordingComplete}
                  title="Tell us some specifics about what you're trying to accomplish"
                  description="Wave a magic wand and you achieve everything you want brilliantly — what does your life look and feel like? How will you know that you've succeeded?"
                  isProcessing={isProcessing}
                  disabled={isLoading}
                />

                {isProcessing && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                      ✨ Analyzing your aspirations and extracting your goals...
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowVoiceRecorder(false);
                      setSelectedCategory('');
                    }}
                    disabled={isLoading}
                    sx={{ mr: 2 }}
                  >
                    Choose Different Goal
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Unsure Flow */}
          {showUnsureFlow && (
            <Fade in={showUnsureFlow} timeout={600}>
              <Card sx={{ mb: 6, borderRadius: 3, backgroundColor: '#fff8e1' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'warning.dark' }}>
                    No worries — that's actually pretty common and totally fine.
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Let's start with what you know:
                  </Typography>

                  <Box component="ul" sx={{ pl: 3, mb: 4 }}>
                    <Typography component="li" variant="body1" sx={{ mb: 2 }}>
                      What's working well in your professional life right now?
                    </Typography>
                    <Typography component="li" variant="body1" sx={{ mb: 2 }}>
                      What's frustrating or feeling stuck?
                    </Typography>
                    <Typography component="li" variant="body1" sx={{ mb: 2 }}>
                      What would you change if you could wave a magic wand?
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Just share whatever comes to mind. We'll help you identify your goal from what you tell us.
                  </Typography>

                  <OnboardingVoiceRecorder
                    memoType="goal"
                    onRecordingComplete={handleRecordingComplete}
                    title="Share what's on your mind"
                    description="Tell us about your current professional situation — what's working, what's not, and what you'd like to change."
                    isProcessing={isProcessing}
                    disabled={isLoading}
                  />

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowUnsureFlow(false)}
                      disabled={isLoading}
                      sx={{ mr: 2 }}
                    >
                      Back to Goal Categories
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleSkipGoals}
                      disabled={isLoading}
                      startIcon={<SkipNext />}
                    >
                      Skip goal-setting for now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Iyanla Vanzant Quote */}
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
              "The way to achieve your own success is to be willing to help somebody else get it first."
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
              — Iyanla Vanzant
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 