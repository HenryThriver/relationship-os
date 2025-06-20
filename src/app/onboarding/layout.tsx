'use client';

import React from 'react';
import { Box, Container, LinearProgress, Typography, IconButton } from '@mui/material';
import { ArrowBack, Close } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const router = useRouter();
  const { 
    progressPercentage, 
    currentScreen, 
    previousScreen, 
    isNavigating,
    config 
  } = useOnboardingState();

  const handleBack = async () => {
    if (currentScreen > 1) {
      await previousScreen();
    }
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header with Progress */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        py: 2
      }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {/* Back Button */}
            <IconButton 
              onClick={handleBack}
              disabled={currentScreen <= 1 || isNavigating}
              size="small"
            >
              <ArrowBack />
            </IconButton>

            {/* Progress Info */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Step {currentScreen} of {config.total_screens}
              </Typography>
            </Box>

            {/* Close Button */}
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Progress Bar */}
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              }
            }}
          />
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
} 