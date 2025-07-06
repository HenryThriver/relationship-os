'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import NextLink from 'next/link';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { ArtifactTimeline } from '@/components/features/timeline/ArtifactTimeline';
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { ArtifactModal } from '@/components/features/timeline/ArtifactModal';
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import { useLoops } from '@/lib/hooks/useLoops';
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration';
import { BaseArtifact, LoopStatus, LinkedInArtifactContent } from '@/types';
import { PersonalContext as PersonalContextType } from '@/types/contact';
import { useQueryClient } from '@tanstack/react-query';

export default function ContactTimelinePage() {
  const params = useParams();
  const contactId = params.id as string;
  const queryClient = useQueryClient();
  
  const [selectedArtifact, setSelectedArtifact] = useState<BaseArtifact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { contact, isLoading, error } = useContactProfile(contactId);
  const {
    updateLoopStatus,
  } = useLoops(contactId);
  
  // Gmail integration for automatic email sync
  const {
    isConnected: gmailConnected,
    isSyncing: emailSyncing,
  } = useGmailIntegration();

  const personalContextForHeader = useMemo(() => {
    if (!contact?.personal_context) return undefined;
    return contact.personal_context as PersonalContextType;
  }, [contact?.personal_context]);

  const connectCadenceText = useMemo(() => {
    return contact?.connection_cadence_days 
      ? `Connect every ${contact.connection_cadence_days} days` 
      : undefined;
  }, [contact?.connection_cadence_days]);

  // Automatic email sync when contact loads
  useEffect(() => {
    if (!contact || !gmailConnected || emailSyncing || !contactId) return;

    // Get contact email addresses for sync
    const emailAddresses = [];
    
    // Add primary email if exists
    if (contact.email) {
      emailAddresses.push(contact.email);
    }
    
    // Add additional emails from contact_emails if available
    if (contact.contact_emails && Array.isArray(contact.contact_emails)) {
      const additionalEmails = contact.contact_emails.map((ce: { email: string }) => ce.email);
      emailAddresses.push(...additionalEmails);
    }

    // Only sync if we have email addresses
    if (emailAddresses.length === 0) {
      console.log(`📧 No email addresses found for contact ${contact.name || contactId}`);
      return;
    }

    // Check if we've already synced recently (prevent duplicate syncs)
    const lastSyncKey = `gmail_sync_${contactId}`;
    const lastSyncTime = localStorage.getItem(lastSyncKey);
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes

    if (lastSyncTime && parseInt(lastSyncTime) > fiveMinutesAgo) {
      console.log(`📧 Skipping sync for ${contact.name || contactId} - synced recently`);
      return;
    }

    console.log(`📧 Auto-syncing emails for contact ${contact.name || contactId} with emails:`, emailAddresses);

    // Store sync time to prevent duplicates
    localStorage.setItem(lastSyncKey, now.toString());

    // Trigger email sync (7 days back similar to calendar)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    console.log(`📧 Auto-syncing emails for date range: ${sevenDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

    // Use direct API call to avoid function reference issues
    fetch('/api/gmail/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_id: contactId,
        email_addresses: [...new Set(emailAddresses)], // Remove duplicates
        date_range: {
          start: sevenDaysAgo.toISOString(),
          end: today.toISOString(),
        },
        max_results: 100,
      }),
    })
    .then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        console.log('📧 Email sync completed:', data);
        // Invalidate timeline to refresh with new emails
        queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] });
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    })
    .catch((error) => {
      console.error('📧 Auto email sync failed:', error);
      // Remove the sync time if it failed so it can retry
      localStorage.removeItem(lastSyncKey);
    });

  }, [contact, gmailConnected, contactId, emailSyncing, queryClient]); // Removed syncContactEmails from dependencies

  const handleArtifactClick = (artifact: BaseArtifact) => {
    setSelectedArtifact(artifact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArtifact(null);
  };

  const handleLoopStatusUpdate = async (loopId: string, newStatus: LoopStatus) => {
    try {
      if (!updateLoopStatus) { console.warn('updateLoopStatus not available'); return; }
      await updateLoopStatus({ loopId, newStatus });
      await queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] });
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update loop status:', error);
    }
  };

  const handleLoopEdit = async () => {
    console.warn('updateLoopDetails function is not available or its name needs verification in useLoops.');
  };

  const handleLoopDelete = async () => {
    console.warn('deleteLoop function is not available or its name needs verification in useLoops.');
  };

  const handleLoopShare = async (loopId: string) => {
    console.log('Share loop triggered in timeline page:', loopId);
  };

  const handleLoopComplete = async () => {
    console.warn('completeLoop function is not available or its name needs verification in useLoops.');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !contact) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error?.message || 'Failed to load contact timeline. Please try again.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={NextLink} underline="hover" color="inherit" href="/dashboard">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </MuiLink>
        <MuiLink component={NextLink} underline="hover" color="inherit" href={`/dashboard/contacts/${contactId}`}>
          {contact.name || 'Contact'}
        </MuiLink>
        <Typography color="text.primary">Timeline</Typography>
      </Breadcrumbs>

      <ContactHeader 
        name={contact.name || 'Unnamed Contact'}
        title={contact.title}
        company={contact.company}
        connectCadence={connectCadenceText}
        connectDate={contact.last_interaction_date ? new Date(contact.last_interaction_date) : undefined}
        personalContext={personalContextForHeader}
        profilePhotoUrl={(contact.linkedin_data as unknown as LinkedInArtifactContent)?.profilePicture || undefined}
        location={contact.location}
        relationshipScore={contact.relationship_score}
      />
      
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold'}}>
          Interaction Timeline
        </Typography>
        
        <ArtifactTimeline
          contactId={contactId}
          onArtifactClick={handleArtifactClick}
        />
      </Box>

      <ArtifactModal
        open={isModalOpen}
        onClose={handleCloseModal}
        artifact={selectedArtifact}
        contactName={contact.name || 'Contact'}
        onLoopStatusUpdate={handleLoopStatusUpdate}
        onLoopEdit={handleLoopEdit}
        onLoopDelete={handleLoopDelete}
        onLoopShare={handleLoopShare}
        onLoopComplete={handleLoopComplete}
        contactId={contactId}
      />
    </Container>
  );
} 