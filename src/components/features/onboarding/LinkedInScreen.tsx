'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { LinkedIn } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

export default function LinkedInScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <LinkedIn color="primary" sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Connect Your LinkedIn
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        We'll analyze your LinkedIn profile to understand your professional background and identify opportunities to help others.
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={isNavigating}
        sx={{ px: 6, py: 2 }}
      >
        Skip for Now
      </Button>
    </Box>
  );
} 