'use client';

import React from 'react';
import { Container, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'next/navigation';

// Import actual components
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { NextConnection } from '@/components/features/contacts/NextConnection';
import { ActionQueues, ActionItemStatus } from '@/components/features/contacts/ActionQueues';
import { ReciprocityDashboard, ExchangeItem } from '@/components/features/contacts/ReciprocityDashboard';
import { ContextSections } from '@/components/features/contacts/ContextSections';
import { QuickAdd } from '@/components/features/contacts/QuickAdd';

import { useContacts } from '@/lib/hooks/useContacts';
// Import the global Contact type and other necessary types from @/types
import type { 
    Contact, 
    ArtifactGlobal,
    // POGArtifactContent, // Not strictly needed here if we only access status via metadata as any
    // AskArtifactContent  // Same as above
} from '@/types';
// Renamed to avoid potential conflicts, and ensure clarity of origin
import type { ActionItemStatus as ActionQueuesActionItemStatus } from '@/components/features/contacts/ActionQueues';

// Define a more specific Artifact type for this page, including 'status' for ActionQueues
// export interface PageArtifact extends ArtifactGlobal { // REMOVE THIS
//   status?: ActionItemStatus; 
// }

// Extend the global Contact type for this page-specific data structure
// export interface PageContact extends GlobalContact { // REMOVE THIS (GlobalContact was the old Contact)
  // Fields that are not part of the core GlobalContact but are used by this page,
  // or fields that need a more specific type on this page.
//   next_meeting?: {
//     title: string;
//     dateTime: string;
//     location: string;
//     platform?: string;
//     agendaItems?: { id:string; text: string; type: 'celebrate' | 'open_thread' | 'new_thread' }[];
//   } | null;
//   userGoal?: string | null;       // For ContactHeader (page-specific UI concern) -> move to personal_context.relationship_goal or similar if applicable
//   connectCadence?: string | null; // For ContactHeader (page-specific UI concern) -> use contact.connection_cadence_days

  // Overwrite artifacts from GlobalContact to use PageArtifact for the status field
//   artifacts?: PageArtifact[] | null; // Will use Contact.artifacts which is ArtifactGlobal[]

  // For ReciprocityDashboard (these are likely calculated or page-specific state)
  // These fields are not on the new Contact type. They might be derived or fetched separately.
  // For now, assuming they will be handled by ReciprocityDashboard or a separate hook.
//   reciprocityBalance?: number;
//   relationshipHealth?: number;
//   reciprocityStatus?: 'balanced' | 'over-giving' | 'under-giving' | 'neutral';
//   recentExchanges?: ExchangeItem[]; 
//   outstandingCommitments?: { id: string; text: string }[];

  // experience, education, about, personalInterests, professionalExpertise, conversationStarters, 
  // familyMembers, hisGoals, currentVentures, keySkills are now inherited from GlobalContact. -> These are in professional_context / personal_context
// }

interface ContactProfilePageProps {}

const ContactProfilePage: React.FC<ContactProfilePageProps> = () => {
  const params = useParams();
  const contactId = params.id as string;
  // TODO: Replace useContacts().getContactById if a new hook like useContactProfile(contactId) is created
  // For now, assuming getContactById will return data compatible with the new Contact structure or will be updated.
  const { getContactById } = useContacts(); 

  const [contact, setContact] = React.useState<Contact | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (contactId) {
      setIsLoading(true);
      getContactById(contactId)
        .then(data => {
          // Assuming data is compatible with the new Contact structure.
          // If getContactById returns the old structure, a mapping function will be needed here.
          setContact(data as Contact | null); 
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch contact data:", err);
          setError(err.message || "Failed to load contact information.");
          setIsLoading(false);
        });
    }
  }, [contactId, getContactById]);

  if (isLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!contact) {
    return <Container sx={{ py: 4 }}><Alert severity="warning">Contact not found.</Alert></Container>;
  }

  interface ActionItemLike {
    id: string;
    content: string;
    status: ActionQueuesActionItemStatus;
    type: 'pog' | 'ask';
  }
  
  const pogs: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'pog')
    .map((art: ArtifactGlobal): ActionItemLike => ({
      id: art.id,
      content: art.content, 
      status: (art.metadata as any)?.status || 'queued', 
      type: 'pog' as const,
    })) || [];
  
  const asks: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'ask')
    .map((art: ArtifactGlobal): ActionItemLike => ({
      id: art.id,
      content: art.content, 
      status: (art.metadata as any)?.status || 'queued', 
      type: 'ask' as const,
    })) || [];

  const handleRecordNote = () => console.log('Record Note clicked');
  const handleSendPOG = () => console.log('Send POG clicked');
  const handleScheduleConnect = () => console.log('Schedule Connect clicked');
  const handleUpdateStatus = (itemId: string, newStatus: ActionItemStatus, type: 'pog' | 'ask') => {
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
          // userGoal={contact.userGoal} -> Example: contact.personal_context?.relationship_goal
          userGoal={contact.personal_context?.relationship_goal} 
          // connectCadence={contact.connectCadence} -> Example: `Every ${contact.connection_cadence_days} days`
          connectCadence={contact.connection_cadence_days ? `Connect every ${contact.connection_cadence_days} days` : undefined}
        onRecordNote={handleRecordNote}
        onSendPOG={handleSendPOG}
        onScheduleConnect={handleScheduleConnect}
      />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flexGrow: 1, flexBasis: { md: '66%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <NextConnection meeting={undefined /* Placeholder: contact.next_meeting no longer on Contact type */} />
      <ActionQueues 
            pogs={pogs}
            asks={asks}
            onUpdateStatus={handleUpdateStatus}
        onBrainstormPogs={handleBrainstormPogs}
      />
      <ReciprocityDashboard 
            balance={undefined /* Placeholder: contact.reciprocityBalance no longer on Contact type */}
            healthIndex={undefined /* Placeholder: contact.relationshipHealth no longer on Contact type */}
            status={undefined /* Placeholder: contact.reciprocityStatus no longer on Contact type */}
            recentExchanges={undefined /* Placeholder: contact.recentExchanges no longer on Contact type */}
            outstandingCommitments={undefined /* Placeholder: contact.outstandingCommitments no longer on Contact type */}
          />
        </Box>

        <Box sx={{ flexGrow: 1, flexBasis: { md: '33%' } }}>
          {/* Pass contact directly, ContextSections will destructure what it needs.
              It will need to be updated to use contact.professional_context and contact.personal_context */}
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