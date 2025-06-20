'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Psychology, SkipNext } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';

export default function ChallengesScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRecordingComplete = async (audioFile: File) => {
    setIsProcessing(true);
    setError('');

    try {
      // Create FormData for the voice memo upload
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('memo_type', 'challenge');

      // Upload and process the voice memo
      const response = await fetch('/api/voice-memo/onboarding', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process voice memo');
      }

      const result = await response.json();
      
      if (result.success) {
        // Mark this screen as complete
        await completeScreen(currentScreen);
        
        // Move to next screen
        await nextScreen();
      } else {
        throw new Error('Voice memo processing failed');
      }
    } catch (err) {
      console.error('Error processing voice memo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your voice memo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark this screen as complete (even though skipped)
      await completeScreen(currentScreen);
      
      // Move to next screen
      await nextScreen();
    } catch (err) {
      console.error('Error skipping screen:', err);
      setError('Failed to continue. Please try again.');
    }
  };

  const isLoading = isNavigating || isProcessing;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Psychology color="primary" sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          What Makes Networking Challenging?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Help us understand your networking challenges so we can provide personalized support
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Voice Recorder */}
      <Box sx={{ mb: 4 }}>
        <OnboardingVoiceRecorder
          memoType="challenge"
          onRecordingComplete={handleRecordingComplete}
          title="Share Your Networking Challenges"
          description="Tell us about situations where networking feels difficult, awkward, or overwhelming. The more specific you are, the better we can help you overcome these challenges."
          isProcessing={isProcessing}
          disabled={isLoading}
        />
      </Box>

      {/* Prompts to Help */}
      <Box sx={{ mb: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Not sure what to share? Consider these prompts:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            What situations make you feel anxious about networking?
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Do you struggle with starting conversations or following up?
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Are there specific types of events or people that intimidate you?
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            What has prevented you from networking effectively in the past?
          </Typography>
          <Typography component="li" variant="body2">
            Do you feel like you don't have enough to offer others?
          </Typography>
        </Box>
      </Box>

      {/* Skip Option */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleSkip}
          disabled={isLoading}
          startIcon={<SkipNext />}
          sx={{ px: 4, py: 1.5 }}
        >
          Skip This Step
        </Button>
      </Box>

      {/* Additional Context */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Your voice memo will be processed privately and used only to personalize your experience. 
          You can always update or delete this information later.
        </Typography>
      </Box>
    </Box>
  );
} 