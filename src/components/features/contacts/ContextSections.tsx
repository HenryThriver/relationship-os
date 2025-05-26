import React from 'react';
import { Box } from '@mui/material';

// Import the new comprehensive display components
import { PersonalContextDisplay } from './PersonalContext'; // Assuming PersonalContext.tsx exports PersonalContextDisplay
import { ProfessionalContextDisplay } from './ProfessionalContext'; // Assuming ProfessionalContext.tsx exports ProfessionalContextDisplay

// Import the new comprehensive Contact type
import type { Contact, ProfessionalContext as ProfessionalContextTypeAlias, PersonalContext as PersonalContextTypeAlias } from '@/types';

interface ContextSectionsProps {
  contactData: Contact | null; // Use the new Contact type, allow null for loading states
  contactId: string; // Added contactId
}

export const ContextSections: React.FC<ContextSectionsProps> = ({ contactData, contactId }) => {
  if (!contactData) {
    // Optionally return a loading skeleton or null if parent handles loading state
    return null; 
  }

  // contactData.professional_context is Json | null | undefined
  // ProfessionalContextDisplay expects ProfessionalContextTypeAlias | undefined
  const professionalContextProp = contactData.professional_context 
    ? contactData.professional_context as ProfessionalContextTypeAlias 
    : undefined;
  
  // contactData.personal_context is Json | null | undefined
  // PersonalContextDisplay expects PersonalContextTypeAlias | undefined
  const personalContextProp = contactData.personal_context 
    ? contactData.personal_context as PersonalContextTypeAlias 
    : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ProfessionalContextDisplay professionalContext={professionalContextProp} contactId={contactId} />
      <PersonalContextDisplay personalContext={personalContextProp} contactId={contactId} />
      {/* 
        Other general sections or cards that are not part of professional/personal context 
        can be added here if needed in the future.

        The old granular cards like FamilyCard, ProfessionalSnapshotCard, etc., are now replaced 
        by the content within PersonalContextDisplay and ProfessionalContextDisplay.
        If specific layouts or sub-components from those old cards are desired, 
        their logic/UI should be integrated into the new context display components.
      */}
    </Box>
  );
}; 