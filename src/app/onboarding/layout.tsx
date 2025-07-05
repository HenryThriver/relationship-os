'use client';

import React from 'react';
import { Box, Container, Typography, IconButton } from '@mui/material';
import { ArrowBack, Close } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { StageProgress } from '@/components/features/onboarding/StageProgress';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const router = useRouter();
  const { 
    currentScreen, 
    previousScreen, 
    isNavigating,
    state
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Status Bar Section - Fixed Height */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        py: 1.5,
        height: 94, // Fixed header height
        flexShrink: 0 // Prevent shrinking
      }}>
        {/* Back and Close buttons outside container */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          zIndex: 1001 
        }}>
          <IconButton 
            onClick={handleBack}
            disabled={currentScreen <= 1 || isNavigating}
            size="small"
          >
            <ArrowBack />
          </IconButton>
        </Box>
        
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 1001 
        }}>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Stage Progress - centered */}
        <StageProgress 
          currentScreen={currentScreen}
          completedScreens={state?.completed_screens || []}
        />
      </Box>

      {/* Main Content Area - Consistent spacing below header */}
      <Box sx={{ 
        flex: 1, // Take remaining space
        pt: 5, // 40px consistent padding below header
        position: 'relative',
        minHeight: 0 // Allow flex shrinking
      }}>
        {children}
      </Box>
    </Box>
  );
} 