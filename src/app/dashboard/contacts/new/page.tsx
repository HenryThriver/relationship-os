'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Alert, CircularProgress, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LinkedInImportForm } from '@/components/features/linkedin/LinkedInImportForm';
import type { LinkedInImportApiResponse, RapidLinkedInProfile } from '@/types/rapidapi';
import { useContacts } from '@/lib/hooks/useContacts';
import { useArtifacts } from '@/lib/hooks/useArtifacts';
import type { TablesInsert } from '@/lib/supabase/types_db';
import MuiLink from '@mui/material/Link';
import type { Database } from '@/lib/supabase/types_db';

export default function NewContactPage(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { createContact, isCreatingContact, createContactError } = useContacts();
  const { createArtifact, isCreatingArtifact, createArtifactError } = useArtifacts();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fetchedProfile, setFetchedProfile] = useState<RapidLinkedInProfile | null>(null);
  const [originalLinkedinUrl, setOriginalLinkedinUrl] = useState<string | null>(null);
  const [rawApiResponseForArtifact, setRawApiResponseForArtifact] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let message = '';
    if (createContactError) message += `Contact creation error: ${createContactError.message} `;
    if (createArtifactError) message += `Artifact creation error: ${createArtifactError.message}`;
    if (message) setError(message.trim());
    
  }, [createContactError, createArtifactError]);

  const handleProfileFetched = async (apiResponse: LinkedInImportApiResponse): Promise<void> => {
    console.log('[NewContactPage /dashboard/contacts/new] handleProfileFetched triggered', apiResponse);
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!apiResponse.success || !apiResponse.data || !apiResponse.inputLinkedinUrl) {
      setError(apiResponse.error || 'Failed to fetch profile data or missing LinkedIn URL.');
      setFetchedProfile(null);
      setOriginalLinkedinUrl(null);
      setRawApiResponseForArtifact(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    setFetchedProfile(apiResponse.data);
    setOriginalLinkedinUrl(apiResponse.inputLinkedinUrl);
    setRawApiResponseForArtifact(apiResponse.rawResponse as Record<string, unknown>);
    setSuccessMessage('Profile data fetched! Review the details below and confirm to save.');
    setLoading(false);
  };

  const handleConfirmSave = async (): Promise<void> => {
    console.log('[NewContactPage /dashboard/contacts/new] handleConfirmSave triggered');
    if (!fetchedProfile || !originalLinkedinUrl || !user || !rawApiResponseForArtifact) {
      setError('Missing profile data, LinkedIn URL, user authentication, or raw API data for saving.');
      console.error('[NewContactPage /dashboard/contacts/new] Save prerequisites not met:', {
        fetchedProfile: !!fetchedProfile,
        originalLinkedinUrl: !!originalLinkedinUrl,
        user: !!user,
        rawApiResponseForArtifact: !!rawApiResponseForArtifact
      });
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const contactName = `${fetchedProfile.firstName || ''} ${fetchedProfile.lastName || ''}`.trim();
      const contactData: TablesInsert<"contacts"> = {
        user_id: user.id,
        name: contactName || null,
        email: null, 
        linkedin_url: originalLinkedinUrl,
        company: fetchedProfile.position?.[0]?.companyName || null,
        title: fetchedProfile.position?.[0]?.title || null,
        location: fetchedProfile.geo?.full || null,
        notes: fetchedProfile.summary || null,
      };

      const newContact = await createContact(contactData);

      if (newContact && newContact.id) {
        const artifactContent = `LinkedIn profile imported for ${contactName || 'this contact'}. Headline: ${fetchedProfile.headline || 'N/A'}`;
        const artifactData: TablesInsert<"artifacts"> = {
          contact_id: newContact.id,
          user_id: user.id,
          type: 'linkedin_profile',
          content: artifactContent,
          metadata: rawApiResponseForArtifact as unknown as Database['public']['Tables']['artifacts']['Insert']['metadata'],
          timestamp: new Date().toISOString(),
        };
        await createArtifact(artifactData);
        setSuccessMessage('Contact and LinkedIn profile artifact created successfully!');
        setFetchedProfile(null); 
        setOriginalLinkedinUrl(null);
        setRawApiResponseForArtifact(null);
        
        setTimeout(() => {
            router.push(`/dashboard/contacts/${newContact.id}`); // Adjusted redirect to new path structure
        }, 2000);
      } else {
        setError('Failed to create contact or contact ID missing after creation attempt.');
      }
    } catch (e: unknown) {
      console.error('Error creating contact or artifact:', e);
      if (!createContactError && !createArtifactError) {
        const errorMessage = e instanceof Error ? e.message : 'An error occurred during the save process.';
        setError(errorMessage);
      }
    }
  };

  const renderReviewSection = () => {
    if (!fetchedProfile || !originalLinkedinUrl) return null;

    const profileItems = [
      { label: 'Name', value: `${fetchedProfile.firstName || ''} ${fetchedProfile.lastName || ''}`.trim() || 'N/A' },
      { label: 'Headline', value: fetchedProfile.headline || 'N/A' },
      { label: 'Location', value: fetchedProfile.geo?.full || 'N/A' },
      { label: 'Current Company', value: fetchedProfile.position?.[0]?.companyName || 'N/A' },
      { label: 'Current Title', value: fetchedProfile.position?.[0]?.title || 'N/A' },
      { label: 'LinkedIn URL', value: originalLinkedinUrl, isLink: true },
    ];

    return (
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
          Review Profile Data
        </Typography>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          {profileItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', width: '150px', flexShrink: 0, mr: 1 }}>
                {item.label}:
              </Typography>
              {item.isLink ? (
                <MuiLink 
                  component={Link} 
                  href={item.value} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  sx={{ textDecoration: 'underline', color: 'primary.main', wordBreak: 'break-all' }}
                  passHref
                >
                  {item.value}
                </MuiLink>
              ) : (
                <Typography variant="body1" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
                  {item.value}
                </Typography>
              )}
            </Box>
          ))}
          {fetchedProfile.summary && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Summary:
              </Typography>
              <Typography variant="body2" sx={{ maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {fetchedProfile.summary}
              </Typography>
            </Box>
          )}
        </Paper>
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={() => { 
              setFetchedProfile(null); 
              setOriginalLinkedinUrl(null); 
              setRawApiResponseForArtifact(null);
              setError(null); 
              setSuccessMessage(null); 
            }} 
            disabled={isCreatingContact || isCreatingArtifact}
            size="large"
          >
            Import Someone Else
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConfirmSave} 
            disabled={isCreatingContact || isCreatingArtifact}
            size="large"
          >
            Confirm and Save Contact
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Add New Contact via LinkedIn
        </Typography>
        <Link href="/dashboard/contacts" passHref>
          <Button variant="outlined">
            Back to Contacts
          </Button>
        </Link>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {successMessage && !loading && !isCreatingContact && !isCreatingArtifact && 
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        
        {(loading || isCreatingContact || isCreatingArtifact) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3, flexDirection: 'column' }}>
            <CircularProgress size={50} />
            <Typography sx={{mt: 2, color: 'text.secondary'}}>
              {loading ? 'Fetching profile...' : 'Saving contact & artifact...'}
            </Typography>
          </Box>
        )}

        {!fetchedProfile && !(loading || isCreatingContact || isCreatingArtifact) && (
          <LinkedInImportForm onProfileFetched={handleProfileFetched} />
        )}

        {fetchedProfile && !(loading || isCreatingContact || isCreatingArtifact) && renderReviewSection()}
      </Paper>
    </Container>
  );
} 