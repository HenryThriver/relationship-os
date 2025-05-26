'use client';

import React from 'react';
import { Container, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'next/navigation';

// Import actual components
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { NextConnection } from '@/components/features/contacts/NextConnection';
import { ActionQueues, ActionItemStatus as ActionQueuesActionItemStatus } from '@/components/features/contacts/ActionQueues';
import { ReciprocityDashboard, ExchangeItem } from '@/components/features/contacts/ReciprocityDashboard';
import { ContextSections } from '@/components/features/contacts/ContextSections';
import { QuickAdd } from '@/components/features/contacts/QuickAdd';

// Import hooks and types
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import type { 
    Contact, 
    ArtifactGlobal,
    POGArtifactContent,
    AskArtifactContent,
    POGArtifactContentStatus,
    AskArtifactContentStatus
} from '@/types';

interface ContactProfilePageProps {}

const mapPOGStatusToActionQueueStatus = (pogStatus?: POGArtifactContentStatus): ActionQueuesActionItemStatus => {
  if (!pogStatus) return 'queued';
  switch (pogStatus) {
    case 'brainstorm': return 'brainstorm';
    case 'delivered': return 'closed';
    case 'closed': return 'closed';
    case 'offered': return 'active'; // or 'pending' depending on desired UX for ActionQueue
    case 'queued': return 'queued';
    default: return 'queued';
  }
};

const mapAskStatusToActionQueueStatus = (askStatus?: AskArtifactContentStatus): ActionQueuesActionItemStatus => {
  if (!askStatus) return 'queued';
  switch (askStatus) {
    case 'received': return 'closed';
    case 'closed': return 'closed';
    case 'in_progress': return 'active';
    case 'requested': return 'active'; // or 'pending'
    case 'queued': return 'queued';
    default: return 'queued';
  }
};

const ContactProfilePage: React.FC<ContactProfilePageProps> = () => {
  const params = useParams();
  const contactId = params.id as string;

  // Use the new hook to fetch contact data
  const { 
    contact, 
    isLoading, 
    error,
  } = useContactProfile(contactId);

  if (isLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error.message || "Failed to load contact information."}</Alert></Container>;
  }

  if (!contact) {
    return <Container sx={{ py: 4 }}><Alert severity="warning">Contact not found.</Alert></Container>;
  }

  // pogs and asks mapping - ensure content is from metadata if applicable
  interface ActionItemLike {
    id: string;
    content: string;
    status: ActionQueuesActionItemStatus;
    type: 'pog' | 'ask';
  }
  
  const pogs: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'pog')
    .map((art: ArtifactGlobal): ActionItemLike => {
      const metadata = art.metadata as POGArtifactContent | undefined;
      return {
        id: art.id,
        content: metadata?.description || art.content,
        status: mapPOGStatusToActionQueueStatus(metadata?.status), 
        type: 'pog' as const,
      };
    }) || [];
  
  const asks: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'ask')
    .map((art: ArtifactGlobal): ActionItemLike => {
      const metadata = art.metadata as AskArtifactContent | undefined;
      return {
        id: art.id,
        content: metadata?.request_description || art.content,
        status: mapAskStatusToActionQueueStatus(metadata?.status), 
        type: 'ask' as const,
      };
    }) || [];

  const handleRecordNote = () => console.log('Record Note clicked');
  const handleSendPOG = () => console.log('Send POG clicked');
  const handleScheduleConnect = () => console.log('Schedule Connect clicked');
  const handleUpdateStatus = (itemId: string, newStatus: ActionQueuesActionItemStatus, type: 'pog' | 'ask') => {
    console.log(`Update ${type} item ${itemId} to ${newStatus}`);
  };
  const handleBrainstormPogs = () => console.log('Brainstorm POGs clicked');
  const handleQuickAdd = (type: string) => console.log(`Quick Add ${type} clicked`);

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#f3f4f6' }}>
      <Box sx={{ position: 'sticky', top: { xs: 56, sm: 64, md: 0 }, zIndex: 10, backgroundColor: '#f3f4f6', pb: 1, mb:1 }}>
        <ContactHeader 
          name={contact.name}
          title={contact.title}
          company={contact.company}
          location={contact.location}
          profilePhotoUrl={contact.profile_photo_url}
          relationshipScore={contact.relationship_score}
          userGoal={contact.personal_context?.relationship_goal} 
          connectCadence={contact.connection_cadence_days ? `Connect every ${contact.connection_cadence_days} days` : undefined}
          onRecordNote={handleRecordNote}
          onSendPOG={handleSendPOG}
          onScheduleConnect={handleScheduleConnect}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flexGrow: 1, flexBasis: { md: '66%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NextConnection contactId={contactId} /> 
          <ActionQueues 
            pogs={pogs}
            asks={asks}
            onUpdateStatus={handleUpdateStatus}
            onBrainstormPogs={handleBrainstormPogs}
          />
          <ReciprocityDashboard 
            balance={undefined}
            healthIndex={undefined}
            status={undefined}
            recentExchanges={undefined}
            outstandingCommitments={undefined}
          />
        </Box>

        <Box sx={{ flexGrow: 1, flexBasis: { md: '33%' } }}>
          <ContextSections contactData={contact} /> 
        </Box>
      </Box>
      
      <QuickAdd 
        onAddNote={() => handleQuickAdd('note')}
        onAddMeeting={() => handleQuickAdd('meeting')}
        onAddPOG={() => handleQuickAdd('POG')}
        onAddAsk={() => handleQuickAdd('Ask')}
        onAddMilestone={() => handleQuickAdd('milestone')}
      />
      <Box sx={{ textAlign: 'center', py: 3, mt: 4, borderTop: 1, borderColor: 'divider'}}>
        <Typography variant="caption" color="text.secondary">
          Data for {contact.name || 'this contact'}. Last updated: {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>
    </Container>
  );
};

export default ContactProfilePage; 