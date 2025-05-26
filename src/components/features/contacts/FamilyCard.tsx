import React from 'react';
import { Typography, List, ListItem, ListItemText, Box } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  details?: string | null;
}

interface FamilyCardProps {
  familyMembers?: FamilyMember[];
}

const listItemSx = {
  alignItems: 'flex-start',
  py: 0.25, // Tighter spacing
  pl: 0,
};

const nameSx = {
  fontWeight: 'bold', 
  color: '#374151', // gray-700
  fontSize: '0.875rem',
  display: 'inline',
};

const relationshipSx = {
  color: '#6b7280', // gray-500
  fontSize: '0.875rem',
  display: 'inline',
  ml: 0.5, 
};

const detailsSx = {
  fontSize: '0.8rem',
  color: '#4b5563', // gray-600
  display: 'block', // Ensure it takes its own line if long
  mt: 0.25,
  pl: 1, // Indent details slightly
};

export const FamilyCard: React.FC<FamilyCardProps> = ({ familyMembers = [] }) => {
  const mockFamilyMembers: FamilyMember[] = [
    { id: 'fm1', name: 'Julia', relationship: '(Partner)', details: 'Recently moved in together, combining families.' },
    { id: 'fm2', name: 'Sebastian', relationship: '(Son)', details: null },
    { id: 'fm3', name: 'Gabriel', relationship: '(Son)', details: null },
    { id: 'fm4', name: "Julia's Son 1", relationship: "(Partner's Son - Name TBD)", details: null },
    { id: 'fm5', name: "Julia's Son 2", relationship: "(Partner's Son - Name TBD)", details: null },
    { id: 'fm6', name: 'Parents', relationship: '(Details TBD)', details: null },
    { id: 'fm7', name: 'Siblings', relationship: '(Details TBD)', details: null },
  ];

  const displayFamilyMembers = familyMembers.length > 0 ? familyMembers : mockFamilyMembers;

  return (
    <CollapsibleSection title="Family" initialOpen>
      {displayFamilyMembers.length > 0 ? (
        <List dense disablePadding>
          {displayFamilyMembers.map((member) => (
            <ListItem key={member.id} sx={listItemSx}>
              <ListItemText
                disableTypography
                primary={
                  <Box component="span">
                    <Typography component="span" sx={nameSx}>{member.name}</Typography>
                    <Typography component="span" sx={relationshipSx}>{member.relationship}</Typography>
                  </Box>
                }
                secondary={member.details ? (
                  <Typography component="span" sx={detailsSx}>{member.details}</Typography>
                ) : null}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{p:1, textAlign: 'center'}}>
          No family information available.
        </Typography>
      )}
    </CollapsibleSection>
  );
}; 