'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useRouter } from 'next/navigation';

export default function CompleteScreen() {
  const { completeOnboarding, isCompleting } = useOnboardingState();
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      router.push('/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      // Still redirect on error
      router.push('/dashboard');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <CheckCircle color="success" sx={{ fontSize: 64 }} />
      </Box>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Welcome to Connection OS!
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
        Your profile is complete. You're ready to start building meaningful professional relationships.
      </Typography>
      
      <Box sx={{ mb: 6, p: 4, bgcolor: 'primary.50', borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎉 What's Next?
        </Typography>
        <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
          <Typography component="li" variant="body1" sx={{ mb: 1 }}>
            Import your contacts and start building your network
          </Typography>
          <Typography component="li" variant="body1" sx={{ mb: 1 }}>
            Set up integrations with LinkedIn, Gmail, and Calendar
          </Typography>
          <Typography component="li" variant="body1" sx={{ mb: 1 }}>
            Start receiving personalized networking suggestions
          </Typography>
          <Typography component="li" variant="body1">
            Track your progress toward your networking goals
          </Typography>
        </Box>
      </Box>
      
      <Button
        variant="contained"
        size="large"
        onClick={handleComplete}
        disabled={isCompleting}
        sx={{ 
          px: 8, 
          py: 3, 
          fontSize: '1.2rem',
          fontWeight: 'bold',
          borderRadius: 3
        }}
      >
        {isCompleting ? 'Finishing Setup...' : 'Enter Connection OS'}
      </Button>
    </Box>
  );
} 