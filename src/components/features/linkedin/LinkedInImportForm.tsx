'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, Alert, Paper, Card, CardContent, CardHeader } from '@mui/material';
import type { LinkedInImportApiResponse, RapidLinkedInProfile } from '@/types/rapidapi';

interface LinkedInImportFormProps {
  onProfileFetched: (profileData: RapidLinkedInProfile, rawResponse: any) => void; // Callback with fetched data
  // We might want to pass an initial contactId if we are adding a LinkedIn profile to an existing contact
}

export const LinkedInImportForm = ({ onProfileFetched }: LinkedInImportFormProps) => {
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedProfile, setFetchedProfile] = useState<RapidLinkedInProfile | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setFetchedProfile(null);
    setRawApiResponse(null);
    setIsLoading(true);

    if (!linkedinUrl.trim()) {
      setError('LinkedIn URL cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const result = await response.json() as LinkedInImportApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import LinkedIn profile.');
      }
      
      if (result.data) {
        setFetchedProfile(result.data);
        setRawApiResponse(result.rawResponse);
        // Call the callback to lift the state up if needed for further processing/saving
        onProfileFetched(result.data, result.rawResponse);
      } else {
        throw new Error('No profile data received from API.');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('LinkedIn Import Error:', err);
    }
    setIsLoading(false);
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Import LinkedIn Profile
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          label="LinkedIn Profile URL"
          variant="outlined"
          fullWidth
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          required
          disabled={isLoading}
          sx={{ mb: 2 }}
          placeholder="https://www.linkedin.com/in/yourprofile/"
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
          sx={{ mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Fetch Profile Data'}
        </Button>
      </Box>

      {fetchedProfile && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Fetched Profile Preview" />
          <CardContent>
            <Typography variant="subtitle1"><strong>Name:</strong> {fetchedProfile.full_name || `${fetchedProfile.first_name || ''} ${fetchedProfile.last_name || ''}`.trim() || 'N/A'}</Typography>
            <Typography variant="subtitle1"><strong>Headline:</strong> {fetchedProfile.headline || 'N/A'}</Typography>
            <Typography variant="subtitle1"><strong>Location:</strong> {fetchedProfile.location || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Summary:</strong> {fetchedProfile.summary || 'N/A'}</Typography>
            {/* Display more fields as needed for preview */}
            <Typography variant="caption" display="block" sx={{mt:2}}>Poll Date: {new Date().toLocaleDateString()}</Typography>
            {/* The "Save Contact" button would typically be here or outside this form,
                and would use `fetchedProfile` and `rawApiResponse` to create the contact and artifact */}
          </CardContent>
        </Card>
      )}
    </Paper>
  );
}; 