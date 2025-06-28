'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ArrowForward,
  TrendingUp,
  School,
  AutoAwesome
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

interface FeelState {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

interface MasteryLevel {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

export default function BridgeScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showContent, setShowContent] = useState(false);
  const [currentFeelState, setCurrentFeelState] = useState(0);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Carousel rotation for feel states
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeelState(prev => (prev + 1) % feelStates.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const feelStates: FeelState[] = [
    {
      emoji: '🎯',
      title: 'Confident',
      description: 'knowing exactly who to contact, when, and why',
      color: '#2196F3'
    },
    {
      emoji: '🎁',
      title: 'Joy',
      description: 'from delighting people with relevant and well-timed generosity',
      color: '#4CAF50'
    },
    {
      emoji: '🙏',
      title: 'Gratitude',
      description: 'for lucky opportunities finding YOU (that have little to do with luck…)',
      color: '#FF9800'
    },
    {
      emoji: '☺️',
      title: 'Satisfaction',
      description: 'knowing your efforts are efficiently and naturally achieving your ambitions',
      color: '#9C27B0'
    },
    {
      emoji: '⚖️',
      title: 'Ease',
      description: 'in asking because you know the exact balance of your giving',
      color: '#607D8B'
    }
  ];

  const masteryLevels: MasteryLevel[] = [
    {
      icon: <School sx={{ fontSize: 32 }} />,
      title: 'Shu (Follow)',
      subtitle: '💪',
      description: 'proven practices from the world\'s most successful professionals',
      color: '#2196F3'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      title: 'Ha (Adapt)',
      subtitle: '🔄',
      description: 'existing systems to your skills and style',
      color: '#4CAF50'
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 32 }} />,
      title: 'Ri (Transcend)',
      subtitle: '✨',
      description: 'with your own advanced workflows and perfectly molded tooling',
      color: '#FF9800'
    }
  ];

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      py: 4,
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0f9ff 100%)'
    }}>
      <Fade in={showContent} timeout={1000}>
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 3 }}>
          
          {/* Aspirational Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.2,
                color: '#1a1a1a',
                mb: 4,
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              When your networking becomes{' '}
              <Typography 
                component="span" 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                masterful and effortless
              </Typography>
              , you may feel:
            </Typography>
          </Box>

          {/* Feel States Carousel */}
          <Box sx={{ mb: 8 }}>
            {/* Main Feel State Display */}
            <Card sx={{ 
              mb: 4, 
              borderRadius: 4,
              background: `linear-gradient(135deg, ${feelStates[currentFeelState].color}15 0%, ${feelStates[currentFeelState].color}08 100%)`,
              border: `2px solid ${feelStates[currentFeelState].color}30`,
              minHeight: 180,
              display: 'flex',
              alignItems: 'center'
            }}>
              <CardContent sx={{ 
                p: 4, 
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography 
                  sx={{ 
                    fontSize: '4rem',
                    lineHeight: 1,
                    mb: 1
                  }}
                >
                  {feelStates[currentFeelState].emoji}
                </Typography>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600,
                    color: feelStates[currentFeelState].color,
                    mb: 1
                  }}
                >
                  {feelStates[currentFeelState].title}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#555',
                    lineHeight: 1.4,
                    maxWidth: 500,
                    fontWeight: 300
                  }}
                >
                  {feelStates[currentFeelState].description}
                </Typography>
              </CardContent>
            </Card>

            {/* Feel State Indicators */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1,
              mb: 4
            }}>
              {feelStates.map((state, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentFeelState(index)}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: index === currentFeelState ? state.color : '#e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: index === currentFeelState ? 'scale(1.2)' : 'scale(1)',
                    '&:hover': {
                      backgroundColor: state.color,
                      transform: 'scale(1.1)'
                    }
                  }}
                />
              ))}
            </Box>

            {/* Compact Feel State Grid (Mobile) */}
            {isMobile && (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 2,
                mb: 4
              }}>
                {feelStates.map((state, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentFeelState(index)}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 2,
                      backgroundColor: index === currentFeelState ? `${state.color}15` : '#f8f9fa',
                      border: `1px solid ${index === currentFeelState ? state.color : '#e0e0e0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                      {state.emoji}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {state.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Mastery Framework */}
          <Card sx={{ mb: 6, borderRadius: 3, backgroundColor: '#fafafa' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  textAlign: 'center',
                  fontWeight: 500,
                  mb: 4,
                  color: '#1a1a1a'
                }}
              >
                We'll get you there through the ancient path to mastery: Shu Ha Ri
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3
              }}>
                {masteryLevels.map((level, index) => (
                  <Card 
                    key={index}
                    sx={{ 
                      borderRadius: 3,
                      border: `2px solid ${level.color}30`,
                      backgroundColor: `${level.color}08`,
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${level.color}20`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box sx={{ 
                        color: level.color,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}>
                        {level.icon}
                        <Typography sx={{ fontSize: '1.5rem' }}>
                          {level.subtitle}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: level.color,
                          mb: 2
                        }}
                      >
                        {level.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#555',
                          lineHeight: 1.5
                        }}
                      >
                        {level.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4,
                fontWeight: 400,
                color: '#1a1a1a'
              }}
            >
              Let's start with the fundamentals: your #1 professional goal.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={isNavigating}
              endIcon={<ArrowForward />}
              sx={{ 
                px: 8, 
                py: 3,
                borderRadius: 3,
                fontSize: '1.2rem',
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #0288D1 100%)',
                  boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              I'm ready to accelerate my mastery
            </Button>
          </Box>

          {/* Reid Hoffman Quote */}
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
              "Your network is the people who want to help you, and you want to help them, 
              and that's really powerful."
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
              — Reid Hoffman
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 