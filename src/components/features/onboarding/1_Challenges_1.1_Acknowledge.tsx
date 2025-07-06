'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Fade,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  EmojiEvents, 
  Lightbulb,
  ArrowForward
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { getFeatureByKey } from '@/config/cultivateFeatures';

export default function ChallengeRecognitionScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, state: onboardingState } = useOnboardingState();
  const { profile } = useUserProfile();
  
  const [animationStep, setAnimationStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeInsights, setChallengeInsights] = useState<string[]>([]);
  const [challengeFeatureMappings, setChallengeFeatureMappings] = useState<Array<{challenge: string, featureKey: string}>>([]);
  const [hasSharedChallenges, setHasSharedChallenges] = useState(false);

  useEffect(() => {
    const loadChallengeData = async () => {
      try {
        console.log('ChallengeRecognitionScreen - Loading data:', {
          onboardingState,
          challenge_voice_memo_id: onboardingState?.challenge_voice_memo_id,
          profile_challenges: profile?.networking_challenges
        });
        
        // Check if we have onboarding state loaded (don't wait for networking_challenges)
        if (onboardingState !== undefined) {
          // Check if user shared challenges in previous screen
          const sharedChallenges = onboardingState?.challenge_voice_memo_id !== null && onboardingState?.challenge_voice_memo_id !== undefined;
          setHasSharedChallenges(sharedChallenges);
          
          console.log('ChallengeRecognitionScreen - Challenge status:', {
            sharedChallenges,
            challenge_voice_memo_id: onboardingState?.challenge_voice_memo_id
          });
          
          // Set challenge insights if available (they might still be processing)
          if (sharedChallenges && profile?.networking_challenges && profile.networking_challenges.length > 0) {
            setChallengeInsights(profile.networking_challenges);
            console.log('ChallengeRecognitionScreen - Setting insights:', profile.networking_challenges);
          }

          // Set challenge feature mappings if available 
          if (sharedChallenges && profile?.challenge_feature_mappings && profile.challenge_feature_mappings.length > 0) {
            setChallengeFeatureMappings(profile.challenge_feature_mappings);
            console.log('ChallengeRecognitionScreen - Setting feature mappings:', profile.challenge_feature_mappings);
          }
          
          setIsLoading(false);
          
          // Start animation sequence after data loads
          setTimeout(() => startAnimationSequence(), 200);
        }
              } catch (error) {
        console.error('Error loading challenge data:', error);
        setIsLoading(false);
        setTimeout(() => startAnimationSequence(), 200);
      }
    };

    loadChallengeData();
  }, [onboardingState, profile]);

  const startAnimationSequence = () => {
    // Step 1: Show "Thanks for sharing"
    setAnimationStep(1);
    
    // Step 2: Fade out first message, show second message
    setTimeout(() => setAnimationStep(2), 2500);
    
    // Step 3: Fade out second message, show table
    setTimeout(() => setAnimationStep(3), 5000);
  };

  const getChallengeToSolutionMapping = (challenge: string) => {
    // First, try to find the challenge in LLM-generated mappings
    const mappingEntry = challengeFeatureMappings.find(mapping => 
      mapping.challenge.toLowerCase() === challenge.toLowerCase()
    );
    
    if (mappingEntry && mappingEntry.featureKey) {
      // Get feature details from master config
      const feature = getFeatureByKey(mappingEntry.featureKey);
      if (feature) {
        return {
          feature: feature.title,
          description: feature.description
        };
      }
    }
    
    // Fallback to default mapping if LLM mapping not found
    return {
      feature: 'Comprehensive Relationship Intelligence',
      description: 'Our AI-powered platform transforms how you build and maintain professional relationships, making networking systematic and authentic.'
    };
  };

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3
      }}>
        <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Processing your insights...
          </Typography>
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
          mb: 4,
        }}>
          {/* Step 1: "Thanks for sharing" - Only render when active */}
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
                Thanks for sharing.
              </Typography>
            </Fade>
          )}

          {/* Step 2: "Having chatted with hundreds of people..." - Only render when active */}
          {animationStep === 2 && (
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
                Having chatted with hundreds of people, you are definitely not alone.
              </Typography>
            </Fade>
          )}

          {/* Step 3: Header - Only render when active */}
          {animationStep === 3 && (
            <Fade in={true} timeout={1000}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: 'primary.main',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                Here&apos;s how we address each challenge you mentioned:
              </Typography>
            </Fade>
          )}
        </Box>

        {/* Step 3: Table content (positioned below the header) */}
        <Fade in={animationStep === 3} timeout={1000}>
          <Box>

            {hasSharedChallenges && challengeInsights.length > 0 ? (
            <>
              {/* Challenge → Solution Mapping */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      border: '1px solid #f0f0f0'
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            sx={{ 
                              fontWeight: 600,
                              color: 'primary.main',
                              borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
                              fontSize: { xs: '0.9rem', md: '1rem' }
                            }}
                          >
                            Challenge
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              fontWeight: 600,
                              color: 'primary.main',
                              borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
                              fontSize: { xs: '0.9rem', md: '1rem' }
                            }}
                          >
                            Cultivate HQ Solution
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {challengeInsights.slice(0, 4).map((challenge, index) => {
                          const solution = getChallengeToSolutionMapping(challenge);
                          return (
                            <TableRow key={index}>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  verticalAlign: 'top',
                                  borderBottom: index === Math.min(challengeInsights.length, 4) - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
                                  fontSize: { xs: '0.9rem', md: '1rem' },
                                  py: 2
                                }}
                              >
                                {challenge}
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  verticalAlign: 'top',
                                  borderBottom: index === Math.min(challengeInsights.length, 4) - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
                                  py: 2
                                }}
                              >
                                <Box>
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: 'success.dark',
                                      mb: 0.5,
                                      fontSize: { xs: '0.9rem', md: '1rem' }
                                    }}
                                  >
                                    {solution.feature}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      lineHeight: 1.5,
                                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                                    }}
                                  >
                                    {solution.description}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Positive Reframing */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '2px solid #e8f5e8', backgroundColor: '#f8fff8' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Lightbulb sx={{ color: 'success.main' }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 500, 
                      color: 'success.dark',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}>
                      You Care Too Much to Leave Relationships to Memory
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ 
                    mb: 3, 
                    lineHeight: 1.6, 
                    color: '#333',
                    fontSize: { xs: '0.95rem', md: '1rem' }
                  }}>
                    Your networking challenges come from caring deeply about authentic, meaningful connections. 
                    We&apos;re going to turn that care into systematic relationship intelligence.
                  </Typography>
                  
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500, 
                    color: 'success.dark', 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.95rem', md: '1rem' }
                  }}>
                    Because you care so much about genuine connection, you&apos;re going to love what technology 
                    unlocks for systematic relationship building.
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Fallback for users who didn't share */
            <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#fafafa' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  That&apos;s completely understandable—trust is earned.
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                  We understand that sharing personal challenges takes trust. Let&apos;s show you what&apos;s possible 
                  with systematic relationship intelligence.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Bridge to Next - Only show in step 3 */}
          {animationStep === 3 && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                disabled={isNavigating}
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
                Show me what&apos;s possible
              </Button>
            </Box>
          )}

          {/* Adam Grant Quote - Only show in step 3 */}
          {animationStep === 3 && (
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
                &quot;When you need help, you&apos;ll be searching your database of people you&apos;ve helped. 
                The bigger that database, the more likely you are to find the help you need.&quot;
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
                — Adam Grant
              </Typography>
            </Box>
          )}
          </Box>
        </Fade>
      </Box>
    </Box>
  );
} 