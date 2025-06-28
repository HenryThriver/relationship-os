'use client';

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useRouter } from 'next/navigation';

// Import onboarding screen components
import WelcomeScreen from '@/components/features/onboarding/WelcomeScreen';
import ChallengesScreen from '@/components/features/onboarding/ChallengesScreen';
import RecognitionScreen from '@/components/features/onboarding/RecognitionScreen';
import BridgeScreen from '@/components/features/onboarding/BridgeScreen';
import GoalsScreen from '@/components/features/onboarding/GoalsScreen';
import ContactImportScreen from '@/components/features/onboarding/ContactImportScreen';
import ContactConfirmationScreen from '@/components/features/onboarding/ContactConfirmationScreen';
import LinkedInScreen from '@/components/features/onboarding/LinkedInScreen';
import ProcessingScreen from '@/components/features/onboarding/ProcessingScreen';
import ProfileScreen from '@/components/features/onboarding/ProfileScreen';
import CompleteScreen from '@/components/features/onboarding/CompleteScreen';

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    state, 
    isLoading, 
    currentScreenName, 
    isComplete 
  } = useOnboardingState();

  // Redirect if onboarding is complete
  React.useEffect(() => {
    if (isComplete) {
      router.push('/dashboard');
    }
  }, [isComplete, router]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading your onboarding progress...
        </Typography>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          Unable to load onboarding state
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try refreshing the page or contact support if the issue persists.
        </Typography>
      </Box>
    );
  }

  // Render the appropriate screen based on current state
  const renderCurrentScreen = () => {
    switch (currentScreenName) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'challenges':
        return <ChallengesScreen />;
      case 'recognition':
        return <RecognitionScreen />;
      case 'bridge':
        return <BridgeScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'contacts':
        return <ContactImportScreen />;
      case 'contact_confirmation':
        return <ContactConfirmationScreen />;
      case 'linkedin':
        return <LinkedInScreen />;
      case 'processing':
        return <ProcessingScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'complete':
        return <CompleteScreen />;
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Unknown Screen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Screen "{currentScreenName}" not found. Please contact support.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      {renderCurrentScreen()}
    </Box>
  );
} 