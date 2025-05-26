import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

interface ProfessionalExpertiseCardProps {
  expertiseTags?: string[];
  keySkills?: string[]; // As shown in mock-up (e.g., Strategic Partnerships)
}

const chipStackSx = {
    pt: 0.5,
};

const chipSx = {
    borderRadius: '4px',
    bgcolor: '#dbeafe', // blue-100
    color: '#1e40af', // blue-800
    fontSize:'0.75rem',
    height: '28px',
    mr: 0.75,
    mb: 0.75,
};

const keySkillsTextSx = {
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

export const ProfessionalExpertiseCard: React.FC<ProfessionalExpertiseCardProps> = ({ 
    expertiseTags = [], 
    keySkills = [] 
}) => {
  const mockExpertiseTags = ['Executive Coaching', 'Leadership Development', 'Networking Strategy', 'Community Building', 'Entrepreneurship', 'Relationship Capital', 'Team Dynamics', 'Public Speaking', 'Workshop Facilitation'];
  const mockKeySkills = ['Strategic Partnerships', 'Business Development', 'Virtual Presentation Strategy'];

  const displayExpertiseTags = expertiseTags.length > 0 ? expertiseTags : mockExpertiseTags;
  const displayKeySkills = keySkills.length > 0 ? keySkills : mockKeySkills;

  return (
    <CollapsibleSection title="Professional Expertise & Tags" initialOpen>
      {displayExpertiseTags.length > 0 && (
        <Box mb={1.5}>
            <Typography sx={subHeaderSx}>Expertise Tags:</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" sx={chipStackSx}>
                {displayExpertiseTags.map((tag, index) => (
                <Chip key={`expertise-${index}`} label={tag} sx={chipSx} />
                ))}
            </Stack>
        </Box>
      )}

      {displayKeySkills.length > 0 && (
        <Box>
            <Typography sx={subHeaderSx}>Key Skills:</Typography>
            <Typography sx={keySkillsTextSx}>
                {displayKeySkills.join(', ')}
            </Typography>
        </Box>
      )}

      {displayExpertiseTags.length === 0 && displayKeySkills.length === 0 && (
         <Typography variant="body2" color="text.secondary" sx={{p:1, textAlign: 'center'}}>
            No professional expertise or key skills logged.
            </Typography>
      )}
    </CollapsibleSection>
  );
}; 