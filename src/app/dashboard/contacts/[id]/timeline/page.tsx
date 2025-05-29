'use client';

import React, { useState, useMemo } from 'react';
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
import { BaseArtifact, LoopStatus, LoopArtifactContent, LinkedInArtifactContent, LoopCompletionOutcome } from '@/types';
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
    refetchLoops
  } = useLoops(contactId);

  const personalContextForHeader = useMemo(() => {
    if (!contact?.personal_context) return undefined;
    return contact.personal_context as PersonalContextType;
  }, [contact?.personal_context]);

  const connectCadenceText = useMemo(() => {
    return contact?.connection_cadence_days 
      ? `Connect every ${contact.connection_cadence_days} days` 
      : undefined;
  }, [contact?.connection_cadence_days]);

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

  const handleLoopEdit = async (loopId: string, updates: Partial<LoopArtifactContent>) => {
    console.warn('updateLoopDetails function is not available or its name needs verification in useLoops.');
  };

  const handleLoopDelete = async (loopId: string) => {
    console.warn('deleteLoop function is not available or its name needs verification in useLoops.');
  };

  const handleLoopShare = async (loopId: string) => {
    console.log('Share loop triggered in timeline page:', loopId);
  };

  const handleLoopComplete = async (loopId: string, outcomeData: LoopCompletionOutcome) => {
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