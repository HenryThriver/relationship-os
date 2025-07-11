'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Alert,
  Fade,
  Stack,
} from '@mui/material';
import { SkipNext, Help } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';

const GOAL_CATEGORIES = [
  'Land a specific role or make a career transition',
  'Grow or launch my startup',
  'Nurture previous and prospective clients / customers',
  'Find investors or strategic partners',
  'Break into a new industry or market',
  'Learn a new skill or find a new mentor',
  'Maintain or deepen relationships within an existing community',
  'Something else'
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState, state } = useOnboardingState();
  const { isLoading: isLoadingProfile } = useUserProfile();
  
  const [animationStep, setAnimationStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showUnsureFlow, setShowUnsureFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const startAnimationSequence = () => {
      // Step 1: Show opening message
      setAnimationStep(1);
      
      // Step 2: Show question message
      setTimeout(() => setAnimationStep(2), 3500);
      
      // Step 3: Show goal categories (after a moment to read the question)
      setTimeout(() => setAnimationStep(3), 5000);
    };

    // Start animation sequence after brief delay
    const timeoutId = setTimeout(startAnimationSequence, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setError('');

    try {
      // Create initial goal record with selected category
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          create_initial_goal: true,
          goal_category: category
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal record');
      }

      const result = await response.json();
      console.log('Initial goal created:', result.goal);

      // Store goal ID in onboarding state
      await updateState({
        goal_id: result.goal.id
      });

      setShowVoiceRecorder(true);
      setShowUnsureFlow(false);
    } catch (error) {
      console.error('Error creating initial goal:', error);
      setError(error instanceof Error ? error.message : 'Failed to create goal. Please try again.');
    }
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
      // Link voice memo to existing goal record
      if (state?.goal_id) {
        formData.append('goal_id', state.goal_id);
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
          goal_id: state?.goal_id,
          category: selectedCategory,
          memo_type: 'goal',
          user_id: user?.id,
          timestamp: new Date().toISOString()
        });

        // Skip confirmation screen and advance directly
        setIsProcessing(false);
        
        // Brief delay to show success message, then advance
        setTimeout(async () => {
          await handleAdvanceToNextScreen();
        }, 1500);
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

  // Show voice recorder screen
  if (showVoiceRecorder || showUnsureFlow) {
    return (
      <Box sx={{ 
        px: 3,
        pb: 4
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Voice Recorder Section */}
          {showVoiceRecorder && (
            <Fade in={showVoiceRecorder} timeout={1000}>
              <Box>
                {selectedCategory && (
                  <Box sx={{ 
                    textAlign: 'center',
                    mb: 4
                  }}>
                    <Typography 
                      variant="h4" 
                      component="h1"
                      sx={{ 
                        fontWeight: 400,
                        lineHeight: 1.3,
                        color: '#1a1a1a',
                        fontSize: { xs: '1.75rem', md: '2.125rem' },
                        mb: 2
                      }}
                    >
                      Perfect! Clarity is the first step to success.
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.95rem', md: '1.2rem' },
                        mb: 2
                      }}
                    >
                      You want to{' '}
                      <strong style={{ color: '#1976d2' }}>
                        {selectedCategory.toLowerCase()}
                      </strong>
                      .
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        lineHeight: 1.5
                      }}
                    >
                      <i>Now, let&apos;s paint the picture of your success story.</i>
                    </Typography>
                  </Box>
                )}

                <OnboardingVoiceRecorder
                  memoType="goal"
                  onRecordingComplete={handleRecordingComplete}
                  title="🪄 Wave a magic wand"
                  description="You wake up tomorrow and you've achieved your goal brilliantly. Way to go you! 
What does your life look and feel like? How will you know you've succeeded?"
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
                    sx={{ 
                      px: { xs: 3, md: 4 }, 
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none'
                    }}
                  >
                    Choose Different Goal
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Unsure Flow */}
          {showUnsureFlow && (
            <Fade in={showUnsureFlow} timeout={1000}>
              <Box>
                <Card sx={{ mb: 4, borderRadius: 3, border: '2px solid #fff3e0', backgroundColor: '#fffbf2' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 500, 
                      color: 'warning.dark',
                      mb: 2,
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}>
                      No worries — that&apos;s actually pretty common and totally
                      fine.
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      mb: 3, 
                      lineHeight: 1.6, 
                      color: '#333',
                      fontSize: { xs: '0.95rem', md: '1rem' }
                    }}>
                      Let&apos;s start with what you know:
                    </Typography>

                    <Box component="ul" sx={{ pl: 3, mb: 4, color: '#333' }}>
                      <Typography component="li" variant="body1" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        What&apos;s working well in your professional life right now?
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        What&apos;s frustrating or feeling stuck?
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        What would you change if you could wave a magic wand?
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ 
                      fontWeight: 500, 
                      color: 'warning.dark', 
                      lineHeight: 1.6,
                      fontSize: { xs: '0.95rem', md: '1rem' }
                    }}>
                      Just share whatever comes to mind. We&apos;ll help you identify
                      your goal from what you tell us.
                    </Typography>
                  </CardContent>
                </Card>

                <OnboardingVoiceRecorder
                  memoType="goal"
                  onRecordingComplete={handleRecordingComplete}
                  title="Share what's on your mind"
                  description="Tell us about your current professional situation — what's working, what's not, and what you'd like to change."
                  isProcessing={isProcessing}
                  disabled={isLoading}
                />

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowUnsureFlow(false)}
                    disabled={isLoading}
                    sx={{ 
                      mr: 2,
                      px: { xs: 3, md: 4 }, 
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none'
                    }}
                  >
                    Back to Goal Categories
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={handleSkipGoals}
                    disabled={isLoading}
                    startIcon={<SkipNext />}
                    sx={{ 
                      px: { xs: 3, md: 4 }, 
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none'
                    }}
                  >
                    Skip goal-setting for now
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      px: 3,
      pb: 4
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        
        {/* Header Messages Area - Sequential rendering for same position */}
        <Box sx={{ 
          textAlign: 'center',
          mb: 4
          }}>
          
          {/* Step 1: Personalization message */}
          {animationStep === 1 && (
            <Fade in={true} timeout={1000}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Let&apos;s personalize your dashboard to what you&apos;re actually
                aspiring to achieve.
              </Typography>
            </Fade>
          )}

          {/* Step 2: Question message - persistent once shown */}
          {animationStep >= 2 && (
            <Fade in={true} timeout={1000}>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{ 
                    fontWeight: 400,
                    lineHeight: 1.3,
                    color: '#1a1a1a',
                    fontSize: { xs: '1.75rem', md: '2.125rem' },
                    mb: 2
                  }}
                >
                  What is currently your #1 professional goal?
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    fontStyle: 'italic',
                    fontSize: { xs: '0.95rem', md: '1rem' }
                  }}
                >
                  Pick the item below that would most move the needle for you in
                  the next 6-12 months
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>

        {/* Step 3: Goal Categories */}
        <Fade in={animationStep >= 3} timeout={1000}>
          <Box>
            
            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Goal Categories Card */}
            <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e3f2fd' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                        fontSize: { xs: '0.9rem', md: '1rem' },
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
              </CardContent>
            </Card>

            {/* Unsure Option - Simple Link */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                variant="text"
                onClick={handleUnsureClick}
                disabled={isLoading}
                startIcon={<Help sx={{ fontSize: 16 }} />}
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  textTransform: 'none',
                  textDecoration: 'underline',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                    color: 'text.primary'
                  }
                }}
              >
                I&apos;m not sure what I&apos;m trying to accomplish
              </Button>
            </Box>

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
                  mx: 'auto',
                  fontSize: { xs: '0.875rem', md: '0.875rem' }
                }}
              >
                &quot;The way to achieve your own success is to be willing to help
                somebody else get it first.&quot;
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
    </Box>
  );
} 