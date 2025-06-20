'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ConnectWithoutContact } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

export default function BridgeScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ConnectWithoutContact color="primary" sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Let's Bridge to Your Goals
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Now that we understand your challenges, let's focus on what you want to achieve.
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={isNavigating}
        sx={{ px: 6, py: 2 }}
      >
        Set My Goals
      </Button>
    </Box>
  );
} 