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
    Contact as GlobalContact, 
    ArtifactGlobal, 
    // ArtifactTypeGlobal, -- Not directly used, PageArtifact uses ArtifactGlobal's type
    ExperienceItem, // Now imported from @/types
    EducationItem,  // Now imported from @/types
    FamilyMember,   // Now imported from @/types
    GoalItem,       // Now imported from @/types
    VentureItem     // Now imported from @/types
} from '@/types';

// Define a more specific Artifact type for this page, including 'status' for ActionQueues
export interface PageArtifact extends ArtifactGlobal {
  status?: ActionItemStatus; 
}

// Extend the global Contact type for this page-specific data structure
export interface PageContact extends GlobalContact {
  // Fields that are not part of the core GlobalContact but are used by this page,
  // or fields that need a more specific type on this page.
  next_meeting?: {
    title: string;
    dateTime: string;
    location: string;
    platform?: string;
    agendaItems?: { id: string; text: string; type: 'celebrate' | 'open_thread' | 'new_thread' }[];
  } | null;
  userGoal?: string | null;       // For ContactHeader (page-specific UI concern)
  connectCadence?: string | null; // For ContactHeader (page-specific UI concern)
  
  // Overwrite artifacts from GlobalContact to use PageArtifact for the status field
  artifacts?: PageArtifact[] | null;

  // For ReciprocityDashboard (these are likely calculated or page-specific state)
  reciprocityBalance?: number;
  relationshipHealth?: number;
  reciprocityStatus?: 'balanced' | 'over-giving' | 'under-giving' | 'neutral';
  recentExchanges?: ExchangeItem[]; 
  outstandingCommitments?: { id: string; text: string }[];

  // experience, education, about, personalInterests, professionalExpertise, conversationStarters, 
  // familyMembers, hisGoals, currentVentures, keySkills are now inherited from GlobalContact.
}

interface ContactProfilePageProps {}

const ContactProfilePage: React.FC<ContactProfilePageProps> = () => {
  const params = useParams();
  const contactId = params.id as string;
  const { getContactById } = useContacts();

  const [contact, setContact] = React.useState<PageContact | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (contactId) {
      setIsLoading(true);
      getContactById(contactId)
        .then(data => {
          setContact(data as PageContact | null); 
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

  const pogs = contact.artifacts?.filter(art => art.type === 'pog').map(art => ({
    id: art.id,
    content: art.content,
    timestamp: art.timestamp,
    status: art.status || 'queued',
    type: 'pog' as const,
  })) || [];
  
  const asks = contact.artifacts?.filter(art => art.type === 'ask').map(art => ({
    id: art.id,
    content: art.content,
    timestamp: art.timestamp,
    status: art.status || 'queued',
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
          userGoal={contact.userGoal} 
          connectCadence={contact.connectCadence}
        onRecordNote={handleRecordNote}
        onSendPOG={handleSendPOG}
        onScheduleConnect={handleScheduleConnect}
      />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flexGrow: 1, flexBasis: { md: '66%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <NextConnection meeting={contact.next_meeting} />
      <ActionQueues 
            pogs={pogs}
            asks={asks}
            onUpdateStatus={handleUpdateStatus}
        onBrainstormPogs={handleBrainstormPogs}
      />
      <ReciprocityDashboard 
            balance={contact.reciprocityBalance}
            healthIndex={contact.relationshipHealth}
            status={contact.reciprocityStatus}
            recentExchanges={contact.recentExchanges}
            outstandingCommitments={contact.outstandingCommitments}
          />
        </Box>

        <Box sx={{ flexGrow: 1, flexBasis: { md: '33%' } }}>
          {/* Pass contact directly, ContextSections will destructure what it needs based on its ContextData type, which should align with GlobalContact fields */}
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