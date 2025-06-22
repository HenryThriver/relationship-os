'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { LinkedIn, CheckCircle } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function LinkedInScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { analyzeLinkedIn } = useUserProfile();
  
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      const result = await analyzeLinkedIn({ linkedin_url: linkedinUrl });
      
      if (result.success && result.analysis) {
        setAnalysisResults(result.analysis);
        setAnalysisComplete(true);
      } else {
        setError(result.error || 'Failed to analyze LinkedIn profile');
      }
    } catch (err: any) {
      console.error('LinkedIn analysis error:', err);
      // Handle common error cases gracefully
      if (err?.message?.includes('RapidAPI')) {
        setError('LinkedIn analysis service is temporarily unavailable. You can skip this step and add your LinkedIn profile later.');
      } else {
        setError(err?.message || 'Failed to analyze LinkedIn profile');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  const handleSkip = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <LinkedIn color="primary" sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Connect Your LinkedIn
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        We'll analyze your LinkedIn profile to understand your professional background and identify opportunities to help others.
      </Typography>

      {!analysisComplete && (
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/yourname"
            value={linkedinUrl}
            onChange={(e) => {
              setLinkedinUrl(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error || 'Enter your LinkedIn profile URL'}
            sx={{ mb: 3 }}
            disabled={isAnalyzing}
          />

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyzeLinkedIn}
              disabled={isAnalyzing || !linkedinUrl.trim()}
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : <LinkedIn />}
              sx={{ px: 4, py: 1.5 }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Profile'}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={handleSkip}
              disabled={isAnalyzing}
              sx={{ px: 4, py: 1.5 }}
            >
              Skip for Now
            </Button>
          </Stack>
        </Box>
      )}

      {analysisComplete && analysisResults && (
        <Box sx={{ mb: 4 }}>
          <Alert 
            severity="success" 
            icon={<CheckCircle />}
            sx={{ mb: 3, textAlign: 'left' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              LinkedIn Analysis Complete!
            </Typography>
            <Typography variant="body2">
              We've extracted valuable insights from your profile to help personalize your networking experience.
            </Typography>
          </Alert>

          {/* Show analysis highlights */}
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            {analysisResults.expertise_areas?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Your Expertise Areas:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {analysisResults.expertise_areas.slice(0, 4).map((area: string, index: number) => (
                    <Chip key={index} label={area} size="small" color="primary" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            {analysisResults.ways_to_help_others?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Ways You Can Help Others:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {analysisResults.ways_to_help_others.slice(0, 3).map((way: string, index: number) => (
                    <Chip key={index} label={way} size="small" color="secondary" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            disabled={isNavigating}
            sx={{ px: 6, py: 2 }}
          >
            Continue to Processing
          </Button>
        </Box>
      )}

      {error && !isAnalyzing && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
} 