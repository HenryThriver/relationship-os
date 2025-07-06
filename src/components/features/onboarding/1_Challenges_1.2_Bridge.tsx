'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Fade,
} from '@mui/material';
import { 
  ArrowForward,
  AutoAwesome
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

export default function BridgeScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const startAnimationSequence = () => {
      // Step 1: Show opening message
      setAnimationStep(1);
      
      // Step 2: Show vision message  
      setTimeout(() => setAnimationStep(2), 3000);
      
      // Step 3: Show final content
      setTimeout(() => setAnimationStep(3), 6000);
    };

    // Start animation sequence after brief delay
    const timeoutId = setTimeout(startAnimationSequence, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

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
          
          {/* Step 1: Opening message */}
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
                When your networking becomes masterful and effortless...
              </Typography>
            </Fade>
          )}

          {/* Step 2: Vision message */}
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
                You&apos;ll feel confident, generous, and genuinely excited about connecting.
              </Typography>
            </Fade>
          )}

          {/* Step 3: Header */}
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
                We&apos;ll guide you on your path to mastery:
              </Typography>
            </Fade>
          )}
        </Box>

        {/* Step 3: Main content */}
        <Fade in={animationStep === 3} timeout={1000}>
          <Box>
            
            {/* Mastery Path Cards */}
            <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e3f2fd' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <AutoAwesome sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 500, 
                    color: 'primary.main',
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}>
                    The Ancient Path: Shu Ha Ri
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3
                }}>
                  
                  {/* Shu (Follow) */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid #2196F330',
                    backgroundColor: '#2196F308'
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#2196F3',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}>
                      💪 Shu (Follow)
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.5,
                      fontSize: { xs: '0.875rem', md: '0.875rem' }
                    }}>
                      Learn proven practices from the world&apos;s most successful professionals
                    </Typography>
                  </Box>

                  {/* Ha (Adapt) */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid #4CAF5030',
                    backgroundColor: '#4CAF5008'
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#4CAF50',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}>
                      🔄 Ha (Adapt)
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.5,
                      fontSize: { xs: '0.875rem', md: '0.875rem' }
                    }}>
                      Adapt existing systems to your unique skills and style
                    </Typography>
                  </Box>

                  {/* Ri (Transcend) */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid #FF980030',
                    backgroundColor: '#FF980008'
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#FF9800',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}>
                      ✨ Ri (Transcend)
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.5,
                      fontSize: { xs: '0.875rem', md: '0.875rem' }
                    }}>
                      Transcend with your own advanced workflows and perfectly molded tooling
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Next Step Card */}
            <Card sx={{ mb: 4, borderRadius: 3, border: '2px solid #e8f5e8', backgroundColor: '#f8fff8' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500, 
                  color: 'success.dark',
                  mb: 2,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}>
                  Let&apos;s start by excelling at fundamentals
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  mb: 3, 
                  lineHeight: 1.6, 
                  color: '#333',
                  fontSize: { xs: '0.95rem', md: '1rem' }
                }}>
                  To build a system that serves your relationship goals, we begin by focusing on your #1 professional goal. 
                  This helps personalize your recommendations, insights, and action plans for related contacts.
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: 'success.dark', 
                  lineHeight: 1.6,
                  fontSize: { xs: '0.95rem', md: '1rem' }
                }}>
                  Everything you share is in service of helping you achieve what matters most to you.
                </Typography>
              </CardContent>
            </Card>

            {/* Continue Button */}
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
                Continue to my goal
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
                  mx: 'auto',
                  fontSize: { xs: '0.875rem', md: '0.875rem' }
                }}
              >
                &quot;Your network is the people who want to help you, and you want to help them, 
                and that&apos;s really powerful.&quot;
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
    </Box>
  );
} 