import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip } from '@mui/material';
import type { PersonalContext as PersonalContextType } from '@/types';

interface PersonalContextProps {
  personalContext: PersonalContextType | undefined;
  // onUpdate?: (updates: Partial<PersonalContextType>) => void; // For editing later
}

export const PersonalContextDisplay: React.FC<PersonalContextProps> = ({ personalContext }) => {
  if (!personalContext) {
    return null;
  }

  const { 
    family, 
    interests, 
    values, 
    milestones, 
    anecdotes, 
    communication_style, 
    relationship_goal, 
    conversation_starters,
    key_life_events,
    current_challenges,
    upcoming_changes,
    living_situation,
    hobbies,
    travel_plans,
    motivations,
    education
  } = personalContext;

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader 
        title={<Typography variant="h6">Personal Snapshot</Typography>}
      />
      <CardContent>
        {/* Family */}
        {family && (family.partner || (family.children && family.children.length > 0)) && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Family</Typography>
            {family.partner && (
              <Box mb={1}>
                <Typography variant="body1"><strong>Partner:</strong> {family.partner.name}{family.partner.details ? ` (${family.partner.details})` : ''}</Typography>
              </Box>
            )}
            {family.children && family.children.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Children:</Typography>
                <List dense disablePadding>
                  {family.children.map((child, index) => (
                    <ListItem key={index} sx={{pl:1}}>
                      <ListItemText primary={`${child.name} (${child.relationship})${child.details ? ' - ' + child.details : ''}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
             {family.parents && (
                <Typography variant="body2" sx={{mt:1}}><strong>Parents:</strong> {family.parents}</Typography>
            )}
            {family.siblings && (
                <Typography variant="body2" sx={{mt:1}}><strong>Siblings:</strong> {family.siblings}</Typography>
            )}
          </Box>
        )}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Interests</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {interests.map((interest, index) => (
                <Chip key={index} label={interest} size="small" />
              ))}
            </Box>
          </Box>
        )}

        {/* Values */}
        {values && values.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Values</Typography>
            <Typography variant="body2">{values.join(', ')}</Typography>
          </Box>
        )}
        
        {/* Key Life Events - NEW */}
        {key_life_events && key_life_events.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Key Life Events</Typography>
            <List dense disablePadding>
              {key_life_events.map((event: string, index: number) => (
                <ListItem key={`kle-${index}`} sx={{pl:1}}><ListItemText primary={event} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Key Milestones</Typography>
            <List dense disablePadding>
              {milestones.map((milestone, index) => (
                <ListItem key={index} sx={{pl:1}}>
                  <ListItemText 
                    primary={`${milestone.emoji ? milestone.emoji + ' ' : ''}${milestone.event}`}
                    secondary={milestone.date ? `${milestone.date}${milestone.impact ? ' (Impact: ' + milestone.impact + ')' : ''}` : milestone.impact ? `Impact: ${milestone.impact}` : null}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Anecdotes */}
        {anecdotes && anecdotes.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Anecdotes</Typography>
            <List dense disablePadding>
              {anecdotes.map((anecdote, index) => (
                <ListItem key={index} sx={{pl:1}}><ListItemText primary={anecdote} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Current Challenges - NEW */}
        {current_challenges && current_challenges.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Current Challenges</Typography>
            <List dense disablePadding>
              {current_challenges.map((challenge: string, index: number) => (
                <ListItem key={`cc-${index}`} sx={{pl:1}}><ListItemText primary={challenge} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Upcoming Changes - NEW */}
        {upcoming_changes && upcoming_changes.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Upcoming Changes</Typography>
            <List dense disablePadding>
              {upcoming_changes.map((change: string, index: number) => (
                <ListItem key={`uc-${index}`} sx={{pl:1}}><ListItemText primary={change} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Living Situation - NEW */}
        {living_situation && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Living Situation</Typography>
            <Typography variant="body2">{living_situation}</Typography>
          </Box>
        )}

        {/* Hobbies - NEW (similar to Interests) */}
        {hobbies && hobbies.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Hobbies</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {hobbies.map((hobby: string, index: number) => (
                <Chip key={`hobby-${index}`} label={hobby} size="small" />
              ))}
            </Box>
          </Box>
        )}

        {/* Travel Plans - NEW */}
        {travel_plans && travel_plans.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Travel Plans</Typography>
            <List dense disablePadding>
              {travel_plans.map((plan: string, index: number) => (
                <ListItem key={`tp-${index}`} sx={{pl:1}}><ListItemText primary={plan} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Motivations - NEW */}
        {motivations && motivations.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Motivations</Typography>
            <List dense disablePadding>
              {motivations.map((motivation: string, index: number) => (
                <ListItem key={`motiv-${index}`} sx={{pl:1}}><ListItemText primary={motivation} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Education - NEW */}
        {education && education.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Education</Typography>
            <List dense disablePadding>
              {education.map((edu: string, index: number) => (
                <ListItem key={`edu-${index}`} sx={{pl:1}}><ListItemText primary={edu} /></ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Communication Style */}
        {communication_style && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Communication Style</Typography>
            <Typography variant="body2">{communication_style}</Typography>
          </Box>
        )}

        {/* Relationship Goal */}
        {relationship_goal && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>My Relationship Goal</Typography>
            <Typography variant="body2">{relationship_goal}</Typography>
          </Box>
        )}
        
        {/* Conversation Starters */}
        {conversation_starters && (conversation_starters.personal?.length || conversation_starters.professional?.length) && (
            <Box mb={2}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Conversation Starters</Typography>
                 {conversation_starters.personal && conversation_starters.personal.length > 0 && (
                     <Box mb={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Personal:</Typography>
                        <List dense disablePadding>
                            {conversation_starters.personal.map((starter, index) => (
                                <ListItem key={`personal-${index}`} sx={{pl:1}}><ListItemText primary={starter} /></ListItem>
                            ))}
                        </List>
                     </Box>
                 )}
                 {conversation_starters.professional && conversation_starters.professional.length > 0 && (
                     <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Professional:</Typography>
                        <List dense disablePadding>
                            {conversation_starters.professional.map((starter, index) => (
                                <ListItem key={`prof-${index}`} sx={{pl:1}}><ListItemText primary={starter} /></ListItem>
                            ))}
                        </List>
                     </Box>
                 )}
            </Box>
        )}

      </CardContent>
    </Card>
  );
}; 