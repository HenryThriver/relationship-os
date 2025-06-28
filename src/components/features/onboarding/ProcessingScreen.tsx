'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Fade,
  Card,
  CardContent
} from '@mui/material';
import { 
  AutoFixHigh, 
  CheckCircle, 
  Psychology,
  LinkedIn,
  RecordVoiceOver,
  Person,
  NetworkCheck
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface ProcessingPhase {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  icon: React.ReactNode;
}

interface Quote {
  text: string;
  author: string;
  timing: number; // when to show in seconds
}

export default function ProcessingScreen() {
  const { nextScreen, completeScreen, currentScreen, state: onboardingState } = useOnboardingState();
  const { profile, profileCompletion } = useUserProfile();
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const phases: ProcessingPhase[] = [
    {
      id: 'linkedin_analysis',
      title: 'Analyzing your professional story...',
      description: 'Examining your background to understand your unique value proposition',
      duration: 4,
      icon: <LinkedIn />
    },
    {
      id: 'contact_analysis',
      title: 'Processing your goal-related contacts...',
      description: 'Understanding the people who could help with your professional objectives',
      duration: 3,
      icon: <Person />
    },
    {
      id: 'expertise_mapping',
      title: 'Identifying your expertise areas...',
      description: 'Discovering your natural conversation starters and areas of knowledge',
      duration: 3,
      icon: <Psychology />
    },
    {
      id: 'network_synthesis',
      title: 'Creating your relationship intelligence...',
      description: 'Mapping connections between your background and networking opportunities',
      duration: 2,
      icon: <NetworkCheck />
    }
  ];

  const quotes: Quote[] = [
    {
      text: "The currency of real networking is not greed but generosity.",
      author: "Keith Ferrazzi",
      timing: 3
    },
    {
      text: "It is one of the most beautiful compensations of this life that no man can sincerely try to help another without helping himself.",
      author: "Ralph Waldo Emerson",
      timing: 7
    },
    {
      text: "Connection is the energy that exists between people when they feel seen, heard, and valued.",
      author: "Brené Brown",
      timing: 10
    }
  ];

  // Processing timer
  useEffect(() => {
    if (!processingComplete) {
      const timer = setInterval(() => {
        setProcessingTime(prev => {
          const newTime = prev + 1;
          
          // Update current phase based on time
          let totalTime = 0;
          let newPhase = 0;
          for (let i = 0; i < phases.length; i++) {
            totalTime += phases[i].duration;
            if (newTime <= totalTime) {
              newPhase = i;
              break;
            }
          }
          setCurrentPhase(newPhase);
          
          // Show quotes at specific times
          quotes.forEach((quote, index) => {
            if (newTime === quote.timing) {
              setCurrentQuote(index);
            }
          });
          
          // Complete processing at 12 seconds and auto-advance
          if (newTime >= 12) {
            setProcessingComplete(true);
            // Auto-advance to profile screen after a brief moment
            setTimeout(async () => {
              await completeScreen(currentScreen);
              await nextScreen();
            }, 1500);
            return newTime;
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [processingComplete, phases, quotes, completeScreen, currentScreen, nextScreen]);



  const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
  const progress = Math.min((processingTime / totalDuration) * 100, 100);

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
              <AutoFixHigh 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  opacity: 0.9,
                  animation: processingComplete ? 'none' : 'pulse 2s ease-in-out infinite alternate',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                  }
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
              {processingComplete ? 'Analysis Complete!' : 'Reading through your LinkedIn profile and posts'}
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
              {processingComplete 
                ? 'Your personalized networking profile is ready!'
                : 'We\'re processing your LinkedIn profile and goal-related contacts to create personalized recommendations.'
              }
            </Typography>
          </Box>

          {!processingComplete && (
            <>
              {/* Progress Bar */}
              <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Processing Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(progress)}% Complete
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)'
                    }
                  }}
                />
              </Box>

              {/* Current Phase */}
              <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                     <Box sx={{ 
                     color: 'primary.main',
                     mb: 2,
                     display: 'flex',
                     justifyContent: 'center',
                     fontSize: 48
                   }}>
                     {phases[currentPhase]?.icon}
                   </Box>
                  
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 500,
                      color: '#1a1a1a',
                      mb: 2
                    }}
                  >
                    {phases[currentPhase]?.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {phases[currentPhase]?.description}
                  </Typography>
                </CardContent>
              </Card>

              {/* Inspirational Quotes */}
              {quotes[currentQuote] && (
                <Fade in={true} key={currentQuote}>
                  <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'primary.200' }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontStyle: 'italic',
                          color: 'primary.dark',
                          lineHeight: 1.6,
                          mb: 2
                        }}
                      >
                        &quot;{quotes[currentQuote].text}&quot;
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500
                        }}
                      >
                        — {quotes[currentQuote].author}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              
            </>
          )}

          {/* Auto-advancing to profile screen when complete */}
          {processingComplete && (
            <Fade in={processingComplete} timeout={800}>
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 500 }}>
                  Analysis Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Preparing your relationship intelligence profile...
                </Typography>
              </Box>
            </Fade>
          )}

                     {/* Network Visualization Animation */}
           {processingTime > 35 && !processingComplete && (
            <Box sx={{ 
              textAlign: 'center', 
              mt: 4,
              opacity: 0.7,
              animation: 'fadeIn 2s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 0.7 }
              }
            }}>
              <Typography variant="body2" color="text.secondary">
                Almost ready to show you your relationship profile...
              </Typography>
            </Box>
          )}
        </Box>
      </Fade>
    </Box>
  );
} 