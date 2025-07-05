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
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { Flag, SkipNext, Help, ArrowForward, Settings, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  
  const [animationStep, setAnimationStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showUnsureFlow, setShowUnsureFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessConfirmation, setShowSuccessConfirmation] = useState(false);
  const [goalProcessingData, setGoalProcessingData] = useState<any>(null);
  const [isLoadingGoalData, setIsLoadingGoalData] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string>('');

  // Navigation state for debugging
  const [debugMode, setDebugMode] = useState(false);

  // Function to fetch processed goal data
  const fetchProcessedGoalData = async (artifactId: string) => {
    if (!user) return null;
    
    try {
      setIsLoadingGoalData(true);
      
      // First, get the artifact to see if it's processed
      const { data: artifact, error: artifactError } = await supabase
        .from('artifacts')
        .select('ai_parsing_status, transcription')
        .eq('id', artifactId)
        .single();

      if (artifactError || !artifact || artifact.ai_parsing_status !== 'completed') {
        return null;
      }

      // Get the updated self-contact with goal data
      const { data: selfContact, error: contactError } = await supabase
        .from('contacts')
        .select('goal_description, goal_success_criteria, goal_timeline, primary_goal')
        .eq('user_id', user.id)
        .eq('is_self_contact', true)
        .single();

      if (contactError) {
        console.error('Error fetching goal data:', contactError);
        return null;
      }

      // Also check if any goals were created from this voice memo
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('title, description, category, timeline, success_criteria')
        .eq('voice_memo_id', artifactId)
        .eq('user_id', user.id);

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
      }

      return {
        contact: selfContact,
        goals: goals || [],
        transcription: artifact.transcription
      };
    } catch (error) {
      console.error('Error fetching processed goal data:', error);
      return null;
    } finally {
      setIsLoadingGoalData(false);
    }
  };

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

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
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

  // Show success confirmation screen
  if (showSuccessConfirmation) {
    return (
      <Box sx={{ 
        px: 3,
        pb: 4
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Fade in={showSuccessConfirmation} timeout={1000}>
            <Box>
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
                    color: 'success.dark',
                    fontSize: { xs: '1.75rem', md: '2.125rem' }
                  }}
                >
                  🎯 Goal Captured Successfully!
                </Typography>
              </Box>

              <Card sx={{ mb: 4, borderRadius: 3, border: '2px solid #e8f5e8', backgroundColor: '#f8fff8' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  
                  {/* AI Processing Status */}
                  {isLoadingGoalData && (
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography variant="body2" color="text.secondary" display="inline">
                        Analyzing your aspirations...
                      </Typography>
                    </Box>
                  )}

                  {/* Personalized Goal Summary */}
                  {goalProcessingData && (goalProcessingData.contact?.goal_description || goalProcessingData.goals?.length > 0) ? (
                    <Box>
                      <Typography variant="body1" sx={{ 
                        mb: 3, 
                        lineHeight: 1.6, 
                        color: '#333',
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        Thank you for sharing! Here's what we understood from your aspirations:
                      </Typography>

                      {/* Primary Goal */}
                      {goalProcessingData.contact?.primary_goal && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                            🎯 Your Primary Goal
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: '#333', 
                            fontSize: { xs: '0.95rem', md: '1rem' },
                            fontStyle: 'italic',
                            pl: 2,
                            borderLeft: '3px solid #4caf50'
                          }}>
                            "{goalProcessingData.contact.primary_goal}"
                          </Typography>
                        </Box>
                      )}

                      {/* Goal Description */}
                      {goalProcessingData.contact?.goal_description && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                            📋 Goal Details
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#555', 
                            fontSize: { xs: '0.9rem', md: '0.95rem' },
                            lineHeight: 1.5
                          }}>
                            {goalProcessingData.contact.goal_description}
                          </Typography>
                        </Box>
                      )}

                      {/* Timeline & Success Criteria */}
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                        {goalProcessingData.contact?.goal_timeline && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                              ⏰ Timeline
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.9rem' }}>
                              {goalProcessingData.contact.goal_timeline}
                            </Typography>
                          </Box>
                        )}
                        
                        {goalProcessingData.contact?.goal_success_criteria && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
                              ✅ Success Criteria
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555', fontSize: '0.9rem' }}>
                              {goalProcessingData.contact.goal_success_criteria}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Created Goals */}
                      {goalProcessingData.goals && goalProcessingData.goals.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark', mb: 2 }}>
                            🚀 Goals Created
                          </Typography>
                          {goalProcessingData.goals.map((goal: any, index: number) => (
                            <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#f0f8f0', borderRadius: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {goal.title}
                              </Typography>
                              {goal.description && (
                                <Typography variant="body2" sx={{ color: '#555', fontSize: '0.9rem' }}>
                                  {goal.description}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    // Fallback generic message
                    <Box>
                      <Typography variant="body1" sx={{ 
                        mb: 3, 
                        lineHeight: 1.6, 
                        color: '#333',
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        Perfect! We've recorded your aspirations and are analyzing your voice memo to extract your specific goals, timeline, and success criteria.
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Goal Category */}
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
                  
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500, 
                    color: 'success.dark', 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.95rem', md: '1rem' }
                  }}>
                    Your dashboard will be personalized based on what you've shared.
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAdvanceToNextScreen}
                    endIcon={<ArrowForward />}
                    sx={{ 
                      px: { xs: 4, md: 6 }, 
                      py: 2,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      textTransform: 'none'
                    }}
                  >
                    Continue to Next Step
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Auto-advancing in {countdown} seconds
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Box>
    );
  }

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
                      You want to <strong style={{ color: '#1976d2' }}>{selectedCategory.toLowerCase()}</strong>. 
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        lineHeight: 1.5
                      }}
                    >
                      <i>Now, let's paint the picture of your success story.</i>
                    </Typography>
                  </Box>
                )}

                <OnboardingVoiceRecorder
                  memoType="goal"
                  onRecordingComplete={handleRecordingComplete}
                  title="🪄 Wave a magic wand"
                  description="You wake up tomorrow and you've achieved your goal brilliantly. Way to go you! \nWhat does your life look and feel like? How will you know you've succeeded?"
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
                      No worries — that's actually pretty common and totally fine.
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      mb: 3, 
                      lineHeight: 1.6, 
                      color: '#333',
                      fontSize: { xs: '0.95rem', md: '1rem' }
                    }}>
                      Let's start with what you know:
                    </Typography>

                    <Box component="ul" sx={{ pl: 3, mb: 4, color: '#333' }}>
                      <Typography component="li" variant="body1" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        What's working well in your professional life right now?
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ 
                        mb: 2,
                        fontSize: { xs: '0.95rem', md: '1rem' }
                      }}>
                        What's frustrating or feeling stuck?
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
                      Just share whatever comes to mind. We'll help you identify your goal from what you tell us.
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
                Let's personalize your dashboard to what you're actually aspiring to achieve.
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
                  Pick the item below that would most move the needle for you in the next 6-12 months
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
                I'm not sure what I'm trying to accomplish
              </Button>
            </Box>

            {/* Debug Navigation Controls */}
            {debugMode && (
              <Box sx={{ mb: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2, border: '1px dashed #ccc' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
                  🛠️ Debug Navigation
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowVoiceRecorder(false);
                      setShowUnsureFlow(false);
                      setShowSuccessConfirmation(false);
                      setSelectedCategory('');
                    }}
                    startIcon={<NavigateBefore />}
                  >
                    Category Selection
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedCategory('Land a specific role or making a career transition');
                      setShowVoiceRecorder(true);
                      setShowUnsureFlow(false);
                      setShowSuccessConfirmation(false);
                    }}
                    startIcon={<NavigateNext />}
                  >
                    Voice Recording
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowUnsureFlow(true);
                      setShowVoiceRecorder(false);
                      setShowSuccessConfirmation(false);
                      setSelectedCategory('');
                    }}
                    startIcon={<Help />}
                  >
                    Unsure Flow
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setShowSuccessConfirmation(true);
                      setShowVoiceRecorder(false);
                      setShowUnsureFlow(false);
                      // Mock some goal data for testing
                      setGoalProcessingData({
                        contact: {
                          primary_goal: "Land a specific role or make a career transition",
                          goal_description: "Transition from my current marketing role into a product management position at a tech company within the next 6-12 months.",
                          goal_timeline: "6-12 months",
                          goal_success_criteria: "Secure a product manager role with increased responsibility and salary growth of at least 20%"
                        },
                        goals: [],
                        transcription: "Mock transcription for testing purposes"
                      });
                    }}
                    startIcon={<Flag />}
                  >
                    Success Confirmation
                  </Button>
                </Stack>
              </Box>
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
                  mx: 'auto',
                  fontSize: { xs: '0.875rem', md: '0.875rem' }
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

            {/* Debug Toggle */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setDebugMode(!debugMode)}
                startIcon={<Settings />}
                sx={{ 
                  color: 'text.disabled',
                  fontSize: '0.75rem',
                  minHeight: 'auto',
                  py: 0.5
                }}
              >
                {debugMode ? 'Hide' : 'Show'} Debug
              </Button>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
} 