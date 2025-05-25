'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Alert, Button as MuiButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext'; // Corrected import path
import { LinkedInImportForm } from '@/components/features/linkedin/LinkedInImportForm';
import type { RapidLinkedInProfile } from '@/types/rapidapi';
import { useContacts, ContactInsert } from '@/lib/hooks/useContacts';
import { useArtifacts, NewArtifact } from '@/lib/hooks/useArtifacts';

export default function NewContactPageViaLinkedIn() {
  const router = useRouter();
  const { user } = useAuth(); // Assuming useAuth provides the Supabase user object
  const { createContact, isCreatingContact, createContactError } = useContacts();
  const { createArtifact, isCreatingArtifact, createArtifactError } = useArtifacts();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overallLoading, setOverallLoading] = useState<boolean>(false);

  const handleProfileFetched = async (profileData: RapidLinkedInProfile, rawResponse: any) => {
    if (!user) {
      setErrorMessage('User not authenticated. Please log in.');
      return;
    }
    if (!profileData.profile_url) {
        setErrorMessage('Fetched profile data is missing the LinkedIn URL.');
        return;
    }

    setOverallLoading(true);
    setStatusMessage('Profile data fetched. Saving contact...');
    setErrorMessage(null);

    try {
      // 1. Map RapidAPI data to our ContactInsert schema
      const newContactData: ContactInsert = {
        user_id: user.id,
        name: profileData.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || null,
        email: null, // LinkedIn API usually doesn't provide email directly from public profiles
        company: profileData.experiences?.[0]?.company || null,
        title: profileData.headline || profileData.experiences?.[0]?.title || null,
        linkedin_url: profileData.profile_url, // Essential: from the fetched data or the original input URL
        location: profileData.location || null,
        notes: profileData.summary || null,
        // created_at and updated_at are handled by the database
      };

      const createdContact = await createContact(newContactData);
      setStatusMessage('Contact saved! Creating profile artifact...');

      // 2. Create the LinkedIn profile artifact
      const newArtifact: NewArtifact = {
        contact_id: createdContact.id,
        user_id: user.id, // Must match contact's user_id for RLS
        type: 'linkedin_profile', // This must match a value in your artifact_type_enum
        content: `LinkedIn profile imported for ${newContactData.name || 'contact'}. Headline: ${newContactData.title || 'N/A'}`,
        metadata: rawResponse, // Store the full JSON response from RapidAPI
        timestamp: new Date().toISOString(), // Record when the poll/import happened
      };

      await createArtifact(newArtifact);
      setStatusMessage('Contact and LinkedIn profile artifact created successfully!');
      
      // Navigate after a short delay to allow user to read success message
      setTimeout(() => {
        router.push(`/contacts/${createdContact.id}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error saving contact or artifact:', error);
      setErrorMessage(error.message || 'Failed to save contact or artifact.');
      setStatusMessage(null);
    }
    setOverallLoading(false);
  };

  useEffect(() => {
    // Clear messages if there's a createContactError or createArtifactError from hooks
    if (createContactError) setErrorMessage(createContactError.message);
    if (createArtifactError) setErrorMessage( prevError => prevError ? `${prevError}; ${createArtifactError.message}` : createArtifactError.message );
  }, [createContactError, createArtifactError]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Contact via LinkedIn
        </Typography>
        <Link href="/contacts" passHref>
          <MuiButton variant="outlined" disabled={overallLoading}>Back to Contacts</MuiButton>
        </Link>
      </Box>
      
      <LinkedInImportForm onProfileFetched={handleProfileFetched} />

      {(isCreatingContact || isCreatingArtifact || overallLoading) && !errorMessage && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {statusMessage || 'Processing...'}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </Container>
  );
} 