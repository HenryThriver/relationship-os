'use client';

import React from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowBack, Close } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { StageProgress } from '@/components/features/onboarding/StageProgress';
import { ScreenNavigator } from '@/components/features/onboarding/ScreenNavigator';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const router = useRouter();
  const { 
    currentScreen, 
    previousScreen, 
    navigateToScreen,
    canNavigateToScreen,
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

  const handleNavigateToStage = async (stageScreenNumber: number) => {
    try {
      await navigateToScreen(stageScreenNumber);
    } catch (error) {
      console.error('Failed to navigate to stage:', error);
    }
  };

  const handleNavigateToScreen = async (screenNumber: number) => {
    try {
      await navigateToScreen(screenNumber);
    } catch (error) {
      console.error('Failed to navigate to screen:', error);
    }
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
        height: 120, // Fixed header height (increased to accommodate both navigation components)
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

        {/* Navigation Controls - centered */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 1
        }}>
          {/* Stage Progress */}
          <StageProgress 
            currentScreen={currentScreen}
            completedScreens={state?.completed_screens || []}
            onNavigateToStage={handleNavigateToStage}
            isNavigating={isNavigating}
          />
          
          {/* Screen Navigator */}
          <ScreenNavigator
            currentScreen={currentScreen}
            completedScreens={state?.completed_screens || []}
            onNavigateToScreen={handleNavigateToScreen}
            canNavigateToScreen={canNavigateToScreen}
            isNavigating={isNavigating}
          />
        </Box>
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