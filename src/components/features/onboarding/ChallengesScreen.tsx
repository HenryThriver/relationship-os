'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Fade } from '@mui/material';
import { Psychology, SkipNext } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import OnboardingVoiceRecorder from './OnboardingVoiceRecorder';

export default function ChallengesScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showContent, setShowContent] = useState(false);

  // Trigger fade-in animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
        // Update onboarding state with the voice memo ID
        await updateState({
          challenge_voice_memo_id: result.artifact_id
        });
        
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
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      py: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 700, mx: 'auto', px: 3 }}>
          {/* Header with honest, conversational tone */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Psychology 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  opacity: 0.9
                }} 
              />
            </Box>
            
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#1a1a1a',
                mb: 3
              }}
            >
              Let's be honest about networking—most people hate it. Or suck at it. Or both.
            </Typography>
            
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.4,
                mb: 4
              }}
            >
              What are your biggest struggles with building meaningful (and valuable) relationships at scale?
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Voice Recorder */}
          <Box sx={{ mb: 6 }}>
            <OnboardingVoiceRecorder
              memoType="challenge"
              onRecordingComplete={handleRecordingComplete}
              title="Share Your Networking Struggles"
              description="Tell us about situations where networking feels difficult, awkward, or overwhelming. The more specific you are, the better we can help you overcome these challenges."
              isProcessing={isProcessing}
              disabled={isLoading}
            />
          </Box>

          {/* Struggle Examples with Casual Tone */}
          <Box sx={{ 
            mb: 6, 
            p: 4, 
            backgroundColor: '#fafafa',
            borderRadius: 3,
            border: '1px solid #f0f0f0'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 500,
                color: '#333',
                mb: 3
              }}
            >
              You're certainly not alone if you...
            </Typography>
            
            <Box component="ul" sx={{ 
              pl: 0, 
              mb: 0,
              listStyle: 'none'
            }}>
              {[
                'feel icky only reaching out when you need something',
                "aren't confident about what you have to offer",
                "forget people's names and details",
                'are awkward or drained at conferences and events',
                'lack the systems and routines for consistent progress',
                "are too overwhelmed or don't know where to start"
              ].map((struggle, index) => (
                <Typography 
                  key={index}
                  component="li" 
                  variant="body1" 
                  sx={{ 
                    mb: 2,
                    pl: 3,
                    position: 'relative',
                    color: '#555',
                    lineHeight: 1.6,
                    '&::before': {
                      content: '"•"',
                      position: 'absolute',
                      left: 0,
                      color: 'primary.main',
                      fontWeight: 'bold',
                      fontSize: '1.2em'
                    }
                  }}
                >
                  {struggle}
                </Typography>
              ))}
            </Box>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mt: 4,
                fontWeight: 400,
                color: '#333',
                lineHeight: 1.6
              }}
            >
              Whatever it is, tell us. We'll use this to personalize your Relationship Mastery experience.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center', 
            gap: 3,
            mb: 6
          }}>
            <Button
              variant="outlined"
              onClick={handleSkip}
              disabled={isLoading}
              startIcon={<SkipNext />}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              I'd rather not share
            </Button>
          </Box>

          {/* Maya Angelou Quote */}
          <Box sx={{ 
            textAlign: 'center',
            borderTop: '1px solid #e0e0e0',
            pt: 4
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic',
                color: '#666',
                lineHeight: 1.6,
                maxWidth: 500,
                mx: 'auto'
              }}
            >
              "I've learned that people will forget what you said, people will forget what you did, 
              but people will never forget how you made them feel."
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#999',
                mt: 1,
                display: 'block',
                letterSpacing: '0.5px'
              }}
            >
              — Maya Angelou
            </Typography>
          </Box>

          {/* Privacy Notice */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Your voice memo will be processed privately and used only to personalize your experience. 
              You can always update or delete this information later.
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 