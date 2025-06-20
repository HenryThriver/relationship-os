'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

export default function RecognitionScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <EmojiEvents color="primary" sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Great Job Sharing!
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Thank you for being open about your networking challenges. This will help us provide better support.
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={isNavigating}
        sx={{ px: 6, py: 2 }}
      >
        Continue
      </Button>
    </Box>
  );
} 