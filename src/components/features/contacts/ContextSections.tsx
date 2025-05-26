import React from 'react';
import { Box } from '@mui/material';

// Import the new comprehensive display components
import { PersonalContextDisplay } from './PersonalContext'; // Assuming PersonalContext.tsx exports PersonalContextDisplay
import { ProfessionalContextDisplay } from './ProfessionalContext'; // Assuming ProfessionalContext.tsx exports ProfessionalContextDisplay

// Import the new comprehensive Contact type
import type { Contact } from '@/types';

interface ContextSectionsProps {
  contactData: Contact | null; // Use the new Contact type, allow null for loading states
}

export const ContextSections: React.FC<ContextSectionsProps> = ({ contactData }) => {
  if (!contactData) {
    // Optionally return a loading skeleton or null if parent handles loading state
    return null; 
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ProfessionalContextDisplay professionalContext={contactData.professional_context} />
      <PersonalContextDisplay personalContext={contactData.personal_context} />
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