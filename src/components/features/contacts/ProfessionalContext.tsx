import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip } from '@mui/material';
import type { Contact, ProfessionalContext as ProfessionalContextType } from '@/types'; // Assuming ProfessionalContext is also exported or use Contact directly

interface ProfessionalContextProps {
  professionalContext: ProfessionalContextType | undefined; // Allow undefined if contact data might be loading
  // onUpdate?: (updates: Partial<ProfessionalContextType>) => void; // Add later for editing
}

export const ProfessionalContextDisplay: React.FC<ProfessionalContextProps> = ({ professionalContext }) => {
  if (!professionalContext) {
    return null; // Or a loading/empty state indicator
  }

  const { goals, background, current_ventures, speaking_topics, achievements } = professionalContext;

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader 
        title={<Typography variant="h6">Professional Snapshot</Typography>}
        // Action for editing can be added here later
      />
      <CardContent>
        {/* Current Goals */}
        {goals && goals.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Goals
            </Typography>
            <List dense disablePadding>
              {goals.map((goal, index) => (
                <ListItem key={index} sx={{ pl: 1 }}>
                  <ListItemText primary={goal} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Background */}
        {background && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Background
            </Typography>
            {background.focus_areas && (
                <Typography variant="body2" paragraph><strong>Focus:</strong> {background.focus_areas}</Typography>
            )}
            {background.education && background.education.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Education:</Typography>
                <List dense disablePadding>
                  {background.education.map((edu, index) => (
                    <ListItem key={index} sx={{ pl: 1}}><ListItemText primary={edu} /></ListItem>
                  ))}
                </List>
              </Box>
            )}
            {background.previous_companies && background.previous_companies.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Previous Companies:</Typography>
                 <Typography variant="body2" component="div" sx={{ pl: 1 }}>
                    {background.previous_companies.join(', ')}
                </Typography>
              </Box>
            )}
            {background.expertise_areas && background.expertise_areas.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Expertise Areas:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl:1 }}>
                  {background.expertise_areas.map((area, index) => (
                    <Chip key={index} label={area} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Current Ventures */}
        {current_ventures && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Current Ventures
            </Typography>
            <Typography variant="body2">{current_ventures}</Typography>
          </Box>
        )}
        
        {/* Speaking Topics */}
        {speaking_topics && speaking_topics.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Speaking Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {speaking_topics.map((topic, index) => (
                <Chip key={index} label={topic} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Key Achievements
            </Typography>
            <List dense disablePadding>
              {achievements.map((ach, index) => (
                <ListItem key={index} sx={{ display: 'block', pl: 1 }}>
                  <ListItemText 
                    primary={ach.event}
                    secondary={ach.date ? `${ach.date}${ach.details ? ' - ' + ach.details : ''}` : ach.details}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 