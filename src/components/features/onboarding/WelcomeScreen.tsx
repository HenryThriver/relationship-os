'use client';

import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Handshake, TrendingUp, Psychology } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function WelcomeScreen() {
  const { nextScreen, isNavigating } = useOnboardingState();
  const { profile } = useUserProfile();

  const handleGetStarted = async () => {
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to Connection OS
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Let's build your personalized networking profile in just a few minutes
        </Typography>
        
        {profile?.name && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Hi {profile.name}! 👋
          </Typography>
        )}
      </Box>

      {/* What We'll Do */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
          What we'll accomplish together:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, textAlign: 'left' }}>
              <Psychology color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Understand Your Challenges
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share what makes networking difficult for you so we can provide personalized support
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, textAlign: 'left' }}>
              <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Define Your Goals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set clear networking objectives that align with your professional aspirations
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, textAlign: 'left' }}>
              <Handshake color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Discover Your Value
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Identify how you can help others and build meaningful professional relationships
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Time Estimate */}
      <Box sx={{ mb: 6, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          ⏱️ This should take about 5-10 minutes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          You can always come back and update your profile later
        </Typography>
      </Box>

      {/* Get Started Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleGetStarted}
        disabled={isNavigating}
        sx={{ 
          px: 6, 
          py: 2, 
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 3
        }}
      >
        {isNavigating ? 'Loading...' : "Let's Get Started"}
      </Button>
    </Box>
  );
} 