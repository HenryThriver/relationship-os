'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import { LinkedIn } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function LinkedInScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { analyzeLinkedIn } = useUserProfile();
  
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinUrlPattern = /linkedin\.com\/in\/[^\/\?]+/;
    return linkedinUrlPattern.test(url);
  };

  const handleAnalyzeLinkedIn = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter your LinkedIn profile URL');
      return;
    }

    if (!validateLinkedInUrl(linkedinUrl)) {
      setError('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Start the analysis but don't wait for it to complete
      analyzeLinkedIn({ linkedin_url: linkedinUrl }).catch(err => {
        console.error('LinkedIn analysis error:', err);
        // Analysis errors will be handled by the ProcessingScreen
      });
      
      // Immediately move to the next screen (ProcessingScreen will handle waiting)
      await completeScreen(currentScreen);
      await nextScreen();
    } catch (err: any) {
      console.error('LinkedIn flow error:', err);
      setError(err?.message || 'Failed to start LinkedIn analysis');
      setIsAnalyzing(false);
    }
  };

  const handleSkip = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Fade in={showContent} timeout={800}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <LinkedIn color="primary" sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Analyze Your Professional Presence
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            We'll analyze your LinkedIn profile and posts to understand your public persona, develop content guidelines, and identify surface area for connection.
          </Typography>

      {(
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="LinkedIn Profile URL"
            placeholder="https://www.linkedin.com/in/handsomehank/"
            value={linkedinUrl}
            onChange={(e) => {
              setLinkedinUrl(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error || undefined}
            sx={{ mb: 3 }}
            disabled={isAnalyzing}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyzeLinkedIn}
              disabled={isAnalyzing || !linkedinUrl.trim()}
              startIcon={<LinkedIn />}
              sx={{ px: 4, py: 1.5, mb: 2 }}
            >
              Analyze Profile
            </Button>
            
            <Typography
              component="button"
              variant="caption"
              color="text.secondary"
              onClick={handleSkip}
              disabled={isAnalyzing}
              sx={{
                background: 'none',
                border: 'none',
                cursor: isAnalyzing ? 'default' : 'pointer',
                textDecoration: 'underline',
                opacity: isAnalyzing ? 0.3 : 0.6,
                '&:hover': {
                  opacity: isAnalyzing ? 0.3 : 0.8
                }
              }}
            >
              Skip for Now
            </Typography>
          </Box>
        </Box>
      )}



      {error && !isAnalyzing && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
        </Box>
      </Fade>
    </Box>
  );
} 