'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Fade,
  Card,
  CardContent
} from '@mui/material';
import { 
  AutoFixHigh, 
  CheckCircle
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

interface Quote {
  text: string;
  author: string;
}

export default function ProcessingScreen() {
  const { nextScreen, completeScreen, currentScreen } = useOnboardingState();
  
  const [showContent, setShowContent] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const quotes: Quote[] = [
    {
      text: "The currency of real networking is not greed but generosity.",
      author: "Keith Ferrazzi"
    },
    {
      text: "Connection is the energy that exists between people when they feel seen, heard, and valued.",
      author: "Brené Brown"
    },
    {
      text: "Great things in business are never done by one person. They're done by a team of people.",
      author: "Steve Jobs"
    }
  ];

  // Auto-advance after showing quotes
  useEffect(() => {
    // Show first quote immediately
    const quoteTimer1 = setTimeout(() => setCurrentQuote(0), 1000);
    
    // Show second quote after 4 seconds
    const quoteTimer2 = setTimeout(() => setCurrentQuote(1), 5000);
    
    // Show third quote after 8 seconds
    const quoteTimer3 = setTimeout(() => setCurrentQuote(2), 9000);
    
    // Complete processing after 11 seconds
    const completeTimer = setTimeout(() => setProcessingComplete(true), 11000);
    
    // Auto-advance after 13 seconds
    const advanceTimer = setTimeout(async () => {
      await completeScreen(currentScreen);
      await nextScreen();
    }, 13000);

    return () => {
      clearTimeout(quoteTimer1);
      clearTimeout(quoteTimer2);
      clearTimeout(quoteTimer3);
      clearTimeout(completeTimer);
      clearTimeout(advanceTimer);
    };
  }, [completeScreen, currentScreen, nextScreen]);

  return (
    <Box sx={{ 
      px: 3,
      pb: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
          
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              {processingComplete ? (
                <CheckCircle 
                  sx={{ 
                    fontSize: 64, 
                    color: 'success.main'
                  }} 
                />
              ) : (
                <AutoFixHigh 
                  sx={{ 
                    fontSize: 64, 
                    color: 'primary.main',
                    opacity: 0.9,
                    animation: 'pulse 2s ease-in-out infinite alternate',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.7 },
                      '100%': { opacity: 1 }
                    }
                  }} 
                />
              )}
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
              {processingComplete ? 'Analysis Complete!' : 'Analyzing your professional presence'}
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
                : 'We\'re processing your LinkedIn profile and posts to develop your personal brief.'
              }
            </Typography>
          </Box>

          {/* Quote Display */}
          {quotes[currentQuote] && (
            <Fade in={true} key={currentQuote} timeout={1000}>
              <Card sx={{ 
                mb: 6, 
                borderRadius: 3, 
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontStyle: 'italic',
                      color: '#333',
                      lineHeight: 1.6,
                      mb: 2
                    }}
                  >
                    "{quotes[currentQuote].text}"
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

          {/* Completion Message */}
          {processingComplete && (
            <Fade in={processingComplete} timeout={800}>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 500, mb: 1 }}>
                  Analysis Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Preparing your relationship intelligence profile...
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Fade>
    </Box>
  );
} 