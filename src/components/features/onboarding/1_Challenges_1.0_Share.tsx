'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent, LinearProgress } from '@mui/material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';
import { PremiumCard, PatternBreakingText } from '@/components/ui/premium';
import { ExecutiveLoading } from '@/components/ui/premium/LoadingStates';

import { sleep } from './0_Welcome_Components/utils/animationSequence';

interface SelectedStruggle {
  icon: string;
  text: string;
  color: string;
}

export default function ChallengesScreen() {
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  
  // Animation orchestration states - renamed for clarity
  const [showHonestLine, setShowHonestLine] = useState(false); // "Let's be honest about networking -"
  const [showHateLine, setShowHateLine] = useState(false); // "most people hate it."
  const [showSuckLine, setShowSuckLine] = useState(false); // "Or suck at it."
  const [showBothLine, setShowBothLine] = useState(false); // "Or both."
  const [fadeOutHeader, setFadeOutHeader] = useState(false); // Fade out the header after impact
  const [showSubtitle, setShowSubtitle] = useState(false); // Question subtitle
  const [showRecorder, setShowRecorder] = useState(false);
  const [showExamples, setShowExamples] = useState(false); // Examples below recorder
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [sequenceStarted, setSequenceStarted] = useState(false);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Curated struggle examples with emotional colors
  const selectedStruggles: SelectedStruggle[] = [
    {
      icon: '🫩',
      text: 'feel guilty only reaching out when you need something',
      color: '#FF6B6B'
    },
    {
      icon: '😮‍💨',
      text: 'aren\'t confident about what you have to offer',
      color: '#4ECDC4'
    },
    {
      icon: '😬',
      text: 'forget people\'s names, families, interests, and other details they\'ve shared',
      color: '#45B7D1'
    },
    {
      icon: '😵‍💫',
      text: 'are awkward or drained at conferences and events',
      color: '#96CEB4'
    },
    {
      icon: '🙄',
      text: 'lack the systems and routines for consistent outreach and progress',
      color: '#FFB347'
    },
    {
      icon: '😵',
      text: 'are too overwhelmed or don\'t know where to start',
      color: '#DDA0DD'
    }
  ];

  // Responsive timing adjustments (kept for potential future use)
  /* const timing = isMobile ? {
    opener: 300,
    reality: 1000,
    examples: 1200,
    validation: 1000,
    recorder: 800,
    skipButton: 2000
  } : {
    opener: 500,
    reality: 1500,
    examples: 1500,
    validation: 1500,
    recorder: 1500,
    skipButton: 2000
  }; */

  useEffect(() => {
    if (sequenceStarted) return;
    
    const orchestrateSequence = async () => {
      setSequenceStarted(true);
      
      try {
        // === HEADER TEXT FADE-IN SEQUENCE ===
        await sleep(1000);
        setShowHonestLine(true); // "Let's be honest about networking -"
        
        await sleep(3000);
        setShowHateLine(true); // "most people hate it."
        
        await sleep(2200);
        setShowSuckLine(true); // "Or suck at it."
        
        await sleep(3300);
        setShowBothLine(true); // "Or both."
        
        // === HEADER IMPACT MOMENT ===
        await sleep(3000); // Let "Or both" have its moment
        
        // === HEADER FADE-OUT (IN PLACE) ===
        setFadeOutHeader(true); // Fade out header where it is, no drift
        
        // === SUBTITLE FADE-IN AND DRIFT SEQUENCE ===
        await sleep(1000); // Let header fade out
        setShowSubtitle(true); // H2 subtitle fades in at same 35% position
        
        await sleep(1500); // Let subtitle fade in
        
        await sleep(1400); // Brief drift animation
        setShowRecorder(true); // Show voice recorder underneath
        setShowSkipButton(true); // Show skip button with the card
        
        await sleep(600); // Brief pause
        setShowExamples(true); // Show examples underneath recorder
        
      } catch (error) {
        console.error('Error in challenges sequence:', error);
        // Fallback: show recorder to allow progression
        setShowRecorder(true);
        setShowSkipButton(true);
      }
    };

    // Start sequence after brief delay
    const timeoutId = setTimeout(orchestrateSequence, 500);
    
    return () => clearTimeout(timeoutId);
  }, [sequenceStarted]); // timing is stable, doesn't need to be in dependencies



  const handleRecordingComplete = async (audioFile: File) => {
    setIsProcessing(true);
    setError('');

    try {
      // Create FormData for the voice memo upload
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('memo_type', 'challenge');

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
      
      console.log('ChallengesScreen - Voice memo upload result:', result);
      
      if (result.success) {
        console.log('ChallengesScreen - Updating onboarding state with artifact ID:', result.artifact_id);
        
        // Update onboarding state with the voice memo ID
        try {
          await updateState({
            challenge_voice_memo_id: result.artifact_id
          });
          console.log('ChallengesScreen - Onboarding state updated successfully');
        } catch (updateError) {
          console.error('ChallengesScreen - Failed to update onboarding state:', updateError);
          throw new Error('Failed to save voice memo reference');
        }
        
        // Mark this screen as complete
        await completeScreen(currentScreen);
        
        // Move to next screen
        await nextScreen();
      } else {
        throw new Error('Voice memo processing failed');
      }
    } catch (err) {
      console.error('Error processing voice memo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your voice memo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark this screen as complete (even though skipped)
      await completeScreen(currentScreen);
      
      // Move to next screen
      await nextScreen();
    } catch (err) {
      console.error('Error skipping screen:', err);
      setError('Failed to continue. Please try again.');
    }
  };

  const isLoading = isNavigating || isProcessing;

  // Shared styling patterns from welcome screen
  const sharedStyles = {
    gradientText: {
      background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 50%, #1976D2 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent'
    },
    
    smoothTransition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }
  };

  return (
    <>
      {/* Main content container */}
      <Box sx={{ 
        px: 3,
        pb: 4
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          
          {/* Header Messages Area - Consistent position for all messages */}
          <Box sx={{ 
            textAlign: 'center',
            mb: 4,
            minHeight: 160, // Reserve space for header animation
            opacity: fadeOutHeader ? 0 : 1,
            transition: 'opacity 1s ease-out'
          }}>
          
          {/* Bold Statement Header (H1) */}
          {showHonestLine && (
            <Typography 
              variant="h1"
              sx={{ 
                textAlign: 'center',
                fontWeight: 500,
                color: '#1a1a1a',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
                lineHeight: 1.2,
                mb: 2,
                opacity: 0,
                transform: 'translateY(0px)',
                animation: 'dramatic-fade-in 1s ease-out forwards',
                transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                ...(showHateLine && {
                  transform: 'translateY(-8px)'
                }),
                ...(showSuckLine && {
                  transform: 'translateY(-12px)'
                }),
                ...(showBothLine && {
                  transform: 'translateY(-16px)'
                }),
                '@keyframes dramatic-fade-in': {
                  '0%': { opacity: 0, transform: 'translateY(15px)' },
                  '100%': { opacity: 1, transform: 'translateY(0px)' }
                },
                '@keyframes reality-fade-in': {
                  '0%': { opacity: 0 },
                  '100%': { opacity: 1 }
                },
                '@keyframes examples-fade-in': {
                  '0%': { opacity: 0 },
                  '100%': { opacity: 1 }
                }
              }}
            >
              <span>Most relationship building feels like speed dating in business casual.</span>
            </Typography>
          )}

          {/* "Or both." as separate punch line */}
          {showBothLine && (
            <Typography 
              variant="h1"
              sx={{ 
                textAlign: 'center',
                fontWeight: 800,
                color: '#1a1a1a',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
                lineHeight: 1.2,
                opacity: 0,
                animation: 'dramatic-fade-in 1s ease-out forwards',
                '@keyframes dramatic-fade-in': {
                  '0%': { opacity: 0, transform: 'translateY(15px)' },
                  '100%': { opacity: 1, transform: 'translateY(0px)' }
                }
              }}
            >
              You deserve better.
            </Typography>
          )}
          </Box>

          {/* Subtitle Section */}
          {showSubtitle && (
            <Box sx={{ 
              textAlign: 'center',
              mb: 4,
              opacity: 0,
              animation: 'subtitle-fade-in 1s ease-out forwards',
              '@keyframes subtitle-fade-in': {
                '0%': { 
                  opacity: 0,
                  transform: 'translateY(20px)'
                },
                '100%': { 
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.4,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  color: 'text.secondary'
                }}
              >
                What strategic challenges create friction in your relationship building?
              </Typography>
            </Box>
          )}

          {/* Voice Recorder Section */}
          {showRecorder && (
            <Box sx={{ 
              opacity: 0,
              animation: 'content-fade-in 1s ease-out forwards',
              '@keyframes content-fade-in': {
                '0%': { 
                  opacity: 0,
                  transform: 'translateY(20px)'
                },
                '100%': { 
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}>

              {/* Voice recorder */}
              <Box sx={{ 
                mb: 4
              }}>
              <PremiumCard accent="sage">
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
                    Share your strategic challenges
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                    Tell us where relationship building creates friction in your professional trajectory. 
                    The more specific, the more value we can deliver.
                  </Typography>
                </Box>

                  {/* Error Alert */}
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <OnboardingVoiceRecorder
                    memoType="challenge"
                    onRecordingComplete={handleRecordingComplete}
                    title=""
                    description=""
                    isProcessing={isProcessing}
                    disabled={isLoading}
                  />
                  
                  {/* Skip option as subdued text link underneath */}
                  {showSkipButton && (
                    <Box sx={{ 
                      textAlign: 'center', 
                      mt: 2
                    }}>
                      <Button
                        variant="text"
                        onClick={handleSkip}
                        disabled={isLoading}
                        sx={{ 
                          color: 'text.secondary',
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          minHeight: 'auto',
                          p: 1,
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        I prefer to proceed without sharing
                      </Button>
                    </Box>
                  )}
                </PremiumCard>
            </Box>

              {/* Examples section */}
              {showExamples && (
                <Box>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      textAlign: 'center',
                      color: '#666',
                      mb: 2,
                      fontWeight: 500
                    }}
                  >
                    You&apos;re not alone if you...
                  </Typography>
                  
                  {selectedStruggles.map((struggle, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: index < 5 ? 1.5 : 0,
                        opacity: 0,
                        animation: `example-cascade 0.6s ease-out ${index * 0.2}s forwards`,
                        '@keyframes example-cascade': {
                          '0%': { 
                            opacity: 0,
                            transform: 'translateX(-20px)'
                          },
                          '100%': { 
                            opacity: 1,
                            transform: 'translateX(0)'
                          }
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '1.2rem', minWidth: 24 }}>
                        {struggle.icon}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          lineHeight: 1.5,
                          color: '#555'
                        }}
                      >
                        {struggle.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Enhanced loading and processing states */}
      {isProcessing && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
        }}>
          <PremiumCard sx={{ maxWidth: 400, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>🎧</Typography>
            <ExecutiveLoading type="relationshipIntelligence" />
          </PremiumCard>
        </Box>
      )}
    </>
  );
} 