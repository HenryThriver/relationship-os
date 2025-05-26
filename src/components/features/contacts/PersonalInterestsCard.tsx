import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

interface PersonalInterestsCardProps {
  interests?: string[]; // Can be undefined, defaults to [] in component
  values?: string[];    // Can be undefined, defaults to [] in component
}

const chipStackSx = {
    pt: 0.5, // Add a little padding top for the chips
};

const chipSx = {
    borderRadius: '4px',
    bgcolor: '#e0e7ff', // indigo-100
    color: '#3730a3', // indigo-800
    fontSize:'0.75rem', // Slightly larger than before
    height: '28px',
    mr: 0.75, // spacing from mock
    mb: 0.75, // spacing from mock
};

const valuesTextSx = {
    fontSize: '0.8rem',
    color: '#4b5563', // gray-600
    mt: 1.5, 
};

const subHeaderSx = {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#6b7280', // gray-500
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    mb: 0.5,
}

export const PersonalInterestsCard: React.FC<PersonalInterestsCardProps> = ({ 
    interests = [], 
    values = [] 
}) => {
  // If props are explicitly passed as undefined, they become [] here.
  // If passed as actual arrays, those are used.
  const mockInterests = ['Intentional Breathwork', 'Meditation', 'Health & Wellness', 'Sauna & Cold Plunge', 'Cycling', 'Acrobatics (Past)'];
  const mockValues = ['Family', 'Personal Growth', 'Resilience', 'Intentionality', 'Community'];

  // Use provided props if they have items, otherwise use mocks only if props were undefined (now empty arrays)
  const displayInterests = interests.length > 0 ? interests : (mockInterests && interests.length === 0 ? mockInterests : []);
  const displayValues = values.length > 0 ? values : (mockValues && values.length === 0 ? mockValues : []);

  return (
    <CollapsibleSection title="Personal Interests & Shares" initialOpen>
      {displayInterests.length > 0 && (
        <Box mb={1.5}>
            <Typography sx={subHeaderSx}>Interests:</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" sx={chipStackSx}>
                {displayInterests.map((interest, index) => (
                <Chip key={`interest-${index}`} label={interest} sx={chipSx} />
                ))}
            </Stack>
        </Box>
      )}

      {displayValues.length > 0 && (
        <Box>
            <Typography sx={subHeaderSx}>Values:</Typography>
            <Typography sx={valuesTextSx}>
                {displayValues.join(', ')}
            </Typography>
        </Box>
      )}

      {displayInterests.length === 0 && displayValues.length === 0 && (
         <Typography variant="body2" color="text.secondary" sx={{p:1, textAlign: 'center'}}>
            No personal interests or values logged.
         </Typography>
      )}
    </CollapsibleSection>
  );
}; 