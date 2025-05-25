'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import type { LinkedInImportApiResponse } from '@/types/rapidapi';

interface LinkedInImportFormProps {
  onProfileFetched: (response: LinkedInImportApiResponse) => void;
}

export const LinkedInImportForm = ({ onProfileFetched }: LinkedInImportFormProps): React.ReactElement => {
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    console.log('[LinkedInImportForm] handleSubmit triggered');
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!linkedinUrl.trim()) {
      setError('LinkedIn Profile URL cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const responseData: LinkedInImportApiResponse = await res.json();

      if (!res.ok || !responseData.success) {
        setError(responseData.error || 'Failed to import LinkedIn profile. Status: ' + res.status);
        onProfileFetched(responseData); 
      } else {
        onProfileFetched(responseData);
      }
    } catch (e: any) {
      console.error('LinkedIn Import Form Error:', e);
      setError(e.message || 'An unexpected error occurred while fetching the profile.');
      onProfileFetched({
        success: false,
        error: e.message || 'An unexpected error occurred during fetch operation.',
        inputLinkedinUrl: linkedinUrl, 
      });
    }
    setIsLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Import LinkedIn Profile
      </Typography>
      <TextField
        label="LinkedIn Profile URL"
        variant="outlined"
        fullWidth
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        required
        disabled={isLoading}
        placeholder="https://www.linkedin.com/in/username/"
        sx={{ mb: 2 }}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        disabled={isLoading}
        fullWidth
        startIcon={isLoading ? null : <LinkedInIcon />}
        sx={{ mb: 2, py: 1.5 }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Import Profile'}
      </Button>
    </Box>
  );
}; 