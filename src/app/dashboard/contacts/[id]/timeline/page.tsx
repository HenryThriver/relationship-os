'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container, Box, Typography, CircularProgress, Alert } from '@mui/material'; // Added CircularProgress & Alert
import { ArtifactTimeline } from '@/components/features/timeline/ArtifactTimeline';
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import { useMemo } from 'react'; // Added useMemo for personalContextForHeader
import type { PersonalContext as PersonalContextType } from '@/types'; // For personalContextForHeader

export default function ContactTimelinePage() {
  const params = useParams();
  const contactId = params.id as string;
  
  const { contact, isLoading, error } = useContactProfile(contactId);

  // Memoize personal context for header to prevent re-renders if contact object changes but context doesn't
  const personalContextForHeader = useMemo(() => {
    return contact?.personal_context 
      ? contact.personal_context as PersonalContextType 
      : undefined;
  }, [contact?.personal_context]);

  // Memoize connect cadence text
  const connectCadenceText = useMemo(() => {
    return contact?.connection_cadence_days 
      ? `Connect every ${contact.connection_cadence_days} days` 
      : undefined;
  }, [contact?.connection_cadence_days]);


  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error.message || "Failed to load contact information."}</Alert>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">Contact not found.</Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* ContactHeader is now part of the ContactLayout for consistent positioning above tabs */}
      {/* We might not need to render it explicitly here if the layout handles it globally for this route segment */}
      {/* However, if ContactLayout only provides tabs, then we still need ContactHeader here or on the parent page */}
      {/* For now, let's assume ContactLayout provides tabs, and this page provides its content including specific header if needed */}
      
      {/* Let's include ContactHeader for now, it can be adjusted based on ContactLayout's final behavior */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'background.paper', pb:1, mb:1 /* Adjust based on tab height */ }}>
        <ContactHeader 
            name={contact.name || 'Unnamed Contact'} 
            title={contact.title}
            company={contact.company}
            profilePhotoUrl={contact.profile_photo_url}
            connectDate={contact.last_contacted_date ? new Date(contact.last_contacted_date) : undefined}
            connectCadence={connectCadenceText}
            // Suggestion related props are not directly relevant for timeline page header, can be omitted or set to 0/default
            suggestionCount={0} 
            suggestionPriority="low" // Or some default
            // Action handlers might not be needed here, or could be no-ops / navigate to overview
            onRecordNote={() => console.log('Record Note from Timeline')} // Placeholder
            onSendPOG={() => console.log('Send POG from Timeline')} // Placeholder
            onScheduleConnect={() => console.log('Schedule Connect from Timeline')} // Placeholder
            onViewSuggestions={() => console.log('View Suggestions from Timeline - maybe navigate to overview?')} // Placeholder
            personalContext={personalContextForHeader}
        />
      </Box>
      
      <Typography variant="h4" sx={{ mb: 3 }}>Artifact Timeline</Typography>
      <ArtifactTimeline contactId={contactId} />
    </Box>
  );
} 