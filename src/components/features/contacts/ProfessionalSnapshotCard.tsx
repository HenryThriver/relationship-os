import React from 'react';
import { Box, Typography, Link, List, ListItem, ListItemText } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ExperienceItem, EducationItem } from '@/types';

export interface GoalItem {
    id: string;
    text: string;
}

export interface VentureItem {
    id: string;
    name: string;
    description?: string;
}

interface ProfessionalSnapshotCardProps {
  about?: string | null;
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  linkedin_profile_url?: string | null;
  hisGoals?: GoalItem[] | null;
  currentVentures?: VentureItem[] | null;
  keySkills?: string[] | null;
}

const listItemPrimaryTextSx = { fontWeight: 500, color: '#1f2937', fontSize: '0.875rem' };
const listItemSecondaryTextSx = { fontSize: '0.8rem', color: '#6b7280' };
const simpleListSx = { listStyleType: 'disc', pl: 2.5, mb:1, '& .MuiListItem-root': { display: 'list-item', pl:0, py: 0.25} };
const sectionContentSx = {
  '& p': { color: '#4b5563', fontSize: '0.875rem', mb: 1, lineHeight: 1.5 },
  '& ul, & ol': { pl: 0, mb: 1, color: '#4b5563', fontSize: '0.875rem', },
  '& li': { mb: 0.5, display: 'block' }, 
  '.section-subheader': { fontSize: '0.8rem', fontWeight: 'bold', color: '#374151', mb: 0.5, display: 'block'}
};

export const ProfessionalSnapshotCard: React.FC<ProfessionalSnapshotCardProps> = ({ 
    about,
    experience,
    education,
    linkedin_profile_url,
    hisGoals,
    currentVentures,
    keySkills,
}) => {

  const mockGoals: GoalItem[] = [
    { id: 'g1', text: 'Beyond Connections for corporate training engagements' },
    { id: 'g2', text: 'Integrating with Julia and family' },
  ];
  const mockVentures: VentureItem[] = [
    { id: 'v1', name: 'Ferrazzi Greenlight', description: 'Partner at Ferrazzi Greenlight, Co-founder of Connected Success & Beyond Connections program.' },
  ];
  const mockKeySkills: string[] = ['Finance (JPMorgan, Lehman)', 'Consulting', 'Entrepreneurship (Cross Campus)'];

  const safeHisGoals = hisGoals ?? [];
  const safeCurrentVentures = currentVentures ?? [];
  const safeKeySkills = keySkills ?? [];

  const displayGoals = safeHisGoals.length > 0 ? safeHisGoals : mockGoals;
  const displayVentures = safeCurrentVentures.length > 0 ? safeCurrentVentures : mockVentures;
  const displayKeySkills = safeKeySkills.length > 0 ? safeKeySkills : mockKeySkills;

  return (
    <CollapsibleSection title="Professional Snapshot" initialOpen>
      <Box sx={sectionContentSx}>
        {displayGoals.length > 0 && (
          <Box mb={1.5}>
            <Typography component="span" className="section-subheader">His Goals:</Typography>
            <List dense disablePadding sx={simpleListSx}>
              {displayGoals.map(goal => (
                <ListItem key={goal.id}><ListItemText primary={goal.text} primaryTypographyProps={{fontSize: '0.875rem'}} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {about && (
          <Box mb={1.5}>
            <Typography component="span" className="section-subheader">Background:</Typography>
            <Typography paragraph sx={{whiteSpace: 'pre-wrap'}}>{about}</Typography>
          </Box>
        )}
        
        {displayVentures.length > 0 && (
            <Box mb={1.5}>
                <Typography component="span" className="section-subheader">Current Ventures:</Typography>
                <List dense disablePadding>
                    {displayVentures.map((venture) => (
                        <ListItem key={venture.id} sx={{display: 'block'}}>
                            <ListItemText 
                                primary={venture.name}
                                secondary={venture.description || null}
                                primaryTypographyProps={{ sx: listItemPrimaryTextSx }}
                                secondaryTypographyProps={{ sx: listItemSecondaryTextSx }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
        )}

        {experience && experience.length > 0 && (
            <Box mb={1.5}>
                <Typography component="span" className="section-subheader">Experience:</Typography>
                <List dense disablePadding>
                    {experience.map((exp, index) => (
                    <ListItem key={index} disableGutters sx={{ mb: 0.5}}>
                        <ListItemText 
                          primary={exp.role}
                          secondary={`${exp.company || ''}${exp.company && (exp.endDate || exp.isCurrent) ? ' · ' : ''}${exp.isCurrent ? 'Current' : exp.endDate || ''}`}
                          primaryTypographyProps={{ sx: listItemPrimaryTextSx }}
                          secondaryTypographyProps={{ sx: listItemSecondaryTextSx }}
                        />
                    </ListItem>
                    ))}
                </List>
            </Box>
        )}

        {education && education.length > 0 && (
            <Box mb={1.5}>
                <Typography component="span" className="section-subheader">Education:</Typography>
                <List dense disablePadding>
                    {education.map((edu, index) => (
                    <ListItem key={index} disableGutters sx={{ mb: 0.5}}>
                        <ListItemText 
                          primary={edu.institution}
                          secondary={`${edu.degree || ''}`}
                          primaryTypographyProps={{ sx: listItemPrimaryTextSx }}
                          secondaryTypographyProps={{ sx: listItemSecondaryTextSx }}
                        />
                    </ListItem>
                    ))}
                </List>
            </Box>
        )}
        
        {linkedin_profile_url && (
            <Link href={linkedin_profile_url} target="_blank" rel="noopener noreferrer" sx={{fontSize: '0.875rem', fontWeight: 500, color: '#1d4ed8'}}>
                View LinkedIn Profile
            </Link>
        )}

        {displayKeySkills.length > 0 && (
             <Box mt={1.5}>
                <Typography component="span" className="section-subheader">Key Skills:</Typography>
                 <Typography paragraph sx={{color: '#4b5563'}}>{displayKeySkills.join(', ')}</Typography>
            </Box>
        )}
      </Box>
    </CollapsibleSection>
  );
}; 