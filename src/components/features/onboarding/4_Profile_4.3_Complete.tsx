'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress,
  Fade,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { CheckCircle, Celebration } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useRouter } from 'next/navigation';

export default function CompleteScreen() {
  const { completeOnboarding, state: onboardingState } = useOnboardingState();
  const { profile } = useUserProfile();
  const router = useRouter();
  
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Completing your onboarding...');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
    
    const finishOnboarding = async () => {
      try {
        // Simulate completion steps with progress
        setProgress(25);
        setStatusMessage('Saving your profile...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setProgress(50);
        setStatusMessage('Preparing your contacts...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setProgress(75);
        setStatusMessage('Setting up your walkthrough...');
        await completeOnboarding();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setProgress(100);
        setStatusMessage('Launching your experience...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get first contact ID from onboarding state or use demo contact
        const firstContactId = onboardingState?.imported_goal_contacts?.[0]?.id 
          ? onboardingState.imported_goal_contacts[0].id
          : 'demo-contact-1';
        
        // Always redirect to the contact page with walkthrough flag
        // If demo-contact-1 doesn't exist, the contact page will show demo content
        router.push(`/dashboard/contacts/${firstContactId}?walkthrough=true`);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still redirect on error
        router.push('/dashboard');
      }
    };

    finishOnboarding();
  }, [completeOnboarding, onboardingState, router]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      py: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3, textAlign: 'center' }}>
          
          {/* Celebration Header */}
          <Box sx={{ mb: 6 }}>
            <Celebration 
              sx={{ 
                fontSize: 80, 
                color: 'primary.main',
                mb: 3,
                animation: 'bounce 2s ease-in-out infinite',
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-10px)' },
                  '60%': { transform: 'translateY(-5px)' }
                }
              }} 
            />
            
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                lineHeight: 1.2,
                color: '#1a1a1a',
                mb: 2
              }}
            >
              Welcome to Connection OS!
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.4
              }}
            >
              Get ready to see your relationship intelligence in action
            </Typography>
          </Box>

          {/* Progress Section */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                  {statusMessage}
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)'
                    }
                  }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {progress}% Complete
                </Typography>
              </Box>

              {progress === 100 && (
                <Alert 
                  severity="success" 
                  icon={<CheckCircle />}
                  sx={{ textAlign: 'left' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Setup Complete!
                  </Typography>
                  <Typography variant="body2">
                    Launching your personalized relationship intelligence demo...
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary">
            You're about to see how Connection OS transforms your networking approach
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
} 