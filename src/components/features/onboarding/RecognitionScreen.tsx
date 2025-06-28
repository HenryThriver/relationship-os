'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Chip,
  Stack,
  Fade,
  LinearProgress
} from '@mui/material';
import { 
  EmojiEvents, 
  Psychology,
  TrendingDown,
  Lightbulb,
  ArrowForward
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function RecognitionScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, state: onboardingState } = useOnboardingState();
  const { profile } = useUserProfile();
  
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeInsights, setChallengeInsights] = useState<string[]>([]);
  const [hasSharedChallenges, setHasSharedChallenges] = useState(false);

  useEffect(() => {
    const loadChallengeData = async () => {
      try {
        console.log('RecognitionScreen - Loading data:', {
          onboardingState,
          challenge_voice_memo_id: onboardingState?.challenge_voice_memo_id,
          profile_challenges: profile?.networking_challenges
        });
        
        // Check if we have onboarding state loaded (don't wait for networking_challenges)
        if (onboardingState !== undefined) {
          // Check if user shared challenges in previous screen
          const sharedChallenges = onboardingState?.challenge_voice_memo_id !== null && onboardingState?.challenge_voice_memo_id !== undefined;
          setHasSharedChallenges(sharedChallenges);
          
          console.log('RecognitionScreen - Challenge status:', {
            sharedChallenges,
            challenge_voice_memo_id: onboardingState?.challenge_voice_memo_id
          });
          
          // Set challenge insights if available (they might still be processing)
          if (sharedChallenges && profile?.networking_challenges && profile.networking_challenges.length > 0) {
            setChallengeInsights(profile.networking_challenges);
            console.log('RecognitionScreen - Setting insights:', profile.networking_challenges);
          }
          
          setIsLoading(false);
          
          // Trigger fade-in after data loads
          setTimeout(() => setShowContent(true), 200);
        }
      } catch (error) {
        console.error('Error loading challenge data:', error);
        setIsLoading(false);
        setShowContent(true);
      }
    };

    loadChallengeData();
  }, [onboardingState, profile]);

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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

  const costItems = [
    {
      icon: '💼',
      text: 'Opportunities you never hear about because you\'re not top-of-mind'
    },
    {
      icon: '🤝',
      text: 'Relationships that fade because months pass between conversations'
    },
    {
      icon: '🎯',
      text: 'Goals that take longer because you don\'t know who could help'
    },
    {
      icon: '⚡',
      text: 'Energy drained by feeling like networking is "work"'
    }
  ];

  const getPersonalizedReframe = () => {
    if (!hasSharedChallenges || challengeInsights.length === 0) {
      return {
        title: "You Care About Authentic Connection",
        description: "Most networking struggles come from caring too much about authentic connection. The people who find networking hardest are often the ones who care most.",
        strength: "You wouldn't be here if you didn't care about fostering meaningful connections at scale."
      };
    }

    // Simple mapping of common challenges to positive reframes
    const insights = challengeInsights.join(' ').toLowerCase();
    
    if (insights.includes('awkward') || insights.includes('uncomfortable')) {
      return {
        title: "You Value Genuine Connection Over Small Talk",
        description: "You feel awkward at events because you value genuine connection over small talk. Now we can use technology to make that authenticity your networking advantage.",
        strength: "Your preference for meaningful conversation is actually a superpower in relationship building."
      };
    }
    
    if (insights.includes('forget') || insights.includes('remember') || insights.includes('details')) {
      return {
        title: "You Care Too Much to Leave Relationships to Memory",
        description: "You forget people's names and details because you're trying to care about everyone manually. We're going to turn that care into systematic relationship intelligence.",
        strength: "Your desire to remember and honor people's details shows how much you value them as individuals."
      };
    }
    
    if (insights.includes('reaching out') || insights.includes('feel gross') || insights.includes('using')) {
      return {
        title: "You Care About Giving Value First",
        description: "The fact that you feel uncomfortable reaching out only when you need something tells us you care deeply about giving value first. We're going to turn that care into systematic relationship intelligence.",
        strength: "Your instinct to lead with generosity is exactly what makes networking powerful and fulfilling."
      };
    }
    
    if (insights.includes('systems') || insights.includes('consistent') || insights.includes('overwhelmed')) {
      return {
        title: "You Want to Do Relationships Right, Not Just Fast",
        description: "You lack systems because you've been trying to keep relationships personal and meaningful. We're going to turn that care into systematic relationship intelligence.",
        strength: "Your commitment to doing relationships properly is what will make you exceptional at it."
      };
    }

    // Default reframe
    return {
      title: "You Care Deeply About Meaningful Relationships",
      description: "Your networking challenges come from caring deeply about authentic, meaningful connections. We're going to turn that care into systematic relationship intelligence.",
      strength: "Because you care so much about genuine connection, you're going to love what technology unlocks for systematic relationship building."
    };
  };

  const personalizedReframe = getPersonalizedReframe();

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
          
          {hasSharedChallenges ? (
            // Path A: They shared challenges
            <>
              {/* Acknowledgment Header */}
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Psychology 
                    sx={{ 
                      fontSize: 64, 
                      color: 'success.main',
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
                    mb: 2
                  }}
                >
                  Thanks for sharing. Having chatted with hundreds of people, you are definitely not alone.
                </Typography>
              </Box>

              {/* Reflection of Their Challenges */}
              {challengeInsights.length > 0 && (
                <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e3f2fd' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
                      You mentioned:
                    </Typography>
                    <Stack spacing={2}>
                      {challengeInsights.slice(0, 3).map((challenge, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Typography sx={{ color: 'primary.main', fontSize: '1.2em', mt: 0.5 }}>•</Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#333' }}>
                            {challenge}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            // Path B: They chose not to share
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <EmojiEvents 
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
                  mb: 2
                }}
              >
                That's completely understandable—trust is earned.
              </Typography>
            </Box>
          )}

          {/* Cost Recognition Section */}
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#fafafa' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <TrendingDown color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {hasSharedChallenges ? "Here's what those patterns probably cost you:" : "Here's what most people experience with networking:"}
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                {costItems.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Typography sx={{ fontSize: '1.5em', minWidth: 32 }}>{item.icon}</Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#555' }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Positive Reframing */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '2px solid #e8f5e8', backgroundColor: '#f8fff8' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Lightbulb sx={{ color: 'success.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500, color: 'success.dark' }}>
                  {personalizedReframe.title}
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, color: '#333' }}>
                {personalizedReframe.description}
              </Typography>
              
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.dark', lineHeight: 1.6 }}>
                {personalizedReframe.strength}
              </Typography>
            </CardContent>
          </Card>

          {/* Bridge to Next */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 400, color: '#1a1a1a' }}>
              You're going to love what technology unlocks for systematic relationship building:
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={isNavigating}
              endIcon={<ArrowForward />}
              sx={{ 
                px: 6, 
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              Show me what's possible
            </Button>
          </Box>

          {/* Adam Grant Quote */}
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
              "When you need help, you'll be searching your database of people you've helped. 
              The bigger that database, the more likely you are to find the help you need."
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
        </Box>
      </Fade>
    </Box>
  );
} 