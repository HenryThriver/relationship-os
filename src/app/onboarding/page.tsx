'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Box, CircularProgress, Typography, Alert, Snackbar } from '@mui/material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useRouter, useSearchParams } from 'next/navigation';

// Import onboarding screen components
import { EnhancedWelcomeScreen } from '@/components/features/onboarding/0_Welcome';
import ChallengesScreen from '@/components/features/onboarding/1_Challenges_1.0_Share';
import ChallengeRecognitionScreen from '@/components/features/onboarding/1_Challenges_1.1_Acknowledge';
import BridgeScreen from '@/components/features/onboarding/1_Challenges_1.2_Bridge';
import GoalsScreen from '@/components/features/onboarding/2_Goals_2.0_Share';
import ContactImportScreen from '@/components/features/onboarding/3_Contacts_3.0_Import';
import ContactConfirmationScreen from '@/components/features/onboarding/3_Contacts_3.1_Confirm';
import ContextDiscoveryScreen from '@/components/features/onboarding/3_Contacts_3.2_Discover';
import LinkedInScreen from '@/components/features/onboarding/4_Profile_4.0_Import';
import ProcessingScreen from '@/components/features/onboarding/4_Profile_4.1_Processing';
import ProfileScreen from '@/components/features/onboarding/4_Profile_4.2_Review';
import CompleteScreen from '@/components/features/onboarding/4_Profile_4.3_Complete';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state: onboardingState,
    updateState,
    completeScreen,
    // nextScreen,
    // previousScreen,
  } = useOnboardingState();

  // Handle OAuth success/error messages
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Handle URL parameters for OAuth feedback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success) {
      setShowAlert({ type: 'success', message: success });
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    } else if (error) {
      setShowAlert({ type: 'error', message: error });
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Redirect if onboarding is complete
  useEffect(() => {
    if (completeScreen) {
      router.push('/dashboard');
    }
  }, [completeScreen, router]);

  if (onboardingState === null) {
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
    switch (onboardingState.currentScreenName) {
      case 'welcome':
        return <EnhancedWelcomeScreen />;
      case 'challenges':
        return <ChallengesScreen />;
      case 'recognition':
        return <ChallengeRecognitionScreen />;
      case 'bridge':
        return <BridgeScreen />;
      case 'goals':
        return <GoalsScreen />;
      case 'contacts':
        return <ContactImportScreen />;
      case 'contact_confirmation':
        return <ContactConfirmationScreen />;
      case 'context_discovery':
        return <ContextDiscoveryScreen />;
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
              Screen "{onboardingState.currentScreenName}" not found. Please contact support.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderCurrentScreen()}
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowAlert(null)}
          severity={showAlert?.type}
          sx={{ width: '100%' }}
        >
          {showAlert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
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
          Loading onboarding...
        </Typography>
      </Box>
    }>
      <OnboardingContent />
    </Suspense>
  );
} 