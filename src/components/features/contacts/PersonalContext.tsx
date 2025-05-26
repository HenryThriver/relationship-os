import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip } from '@mui/material';
import type { PersonalContext as PersonalContextType } from '@/types';
import { SourcedField } from '@/components/ui/SourceAttribution';

interface PersonalContextProps {
  personalContext: PersonalContextType | undefined;
  contactId: string;
  // onUpdate?: (updates: Partial<PersonalContextType>) => void; // For editing later
}

export const PersonalContextDisplay: React.FC<PersonalContextProps> = ({ personalContext, contactId }) => {
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
        {family && (family.partner || (family.children && family.children.length > 0) || family.parents || family.siblings) && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Family</Typography>
            {family.partner && (
              <Box mb={1} sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <SourcedField fieldPath="personal_context.family.partner.name" contactId={contactId} showIndicator={true}>
                  <Typography variant="body1" component="span"><strong>Partner:</strong> {family.partner.name}</Typography>
                </SourcedField>
                {family.partner.details && (
                  <SourcedField fieldPath="personal_context.family.partner.details" contactId={contactId} showIndicator={false} compact={true} className="ml-1">
                    <Typography variant="body1" component="span">({family.partner.details})</Typography>
                  </SourcedField>
                )}
              </Box>
            )}
            {family.children && family.children.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Children:</Typography>
                <List dense disablePadding>
                  {family.children.map((child, index) => (
                    <ListItem key={index} sx={{pl:1, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>
                      <ListItemText 
                        primary={
                          <>
                            <SourcedField 
                              fieldPath={`personal_context.family.children.${index}.name`} 
                              contactId={contactId} 
                              showIndicator={false}
                              compact={true} 
                            >
                              {/* Graceful fallback for name */}
                              <span>{child.name || 'Child'}</span>
                            </SourcedField>
                            {child.relationship && (
                              <SourcedField 
                                fieldPath={`personal_context.family.children.${index}.relationship`}
                                contactId={contactId}
                                showIndicator={false}
                                compact={true}
                                className="ml-0point5" // Small margin if needed
                              >
                                <span>&nbsp;({child.relationship})</span>
                              </SourcedField>
                            )}
                          </>
                        } 
                        primaryTypographyProps={{ component: 'span' }}
                        sx={{ flexGrow: 0, mr: 1 }} // Adjust layout for details
                      />
                      {child.details && (
                        <SourcedField 
                          fieldPath={`personal_context.family.children.${index}.details`} 
                          contactId={contactId} 
                          showIndicator={false} 
                          compact={true} 
                        >
                           <Typography variant="body2" component="span" sx={{ fontStyle: 'italic' }}>- {child.details}</Typography>
                        </SourcedField>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
             {family.parents && (
                <Box mt={1}>
                    <SourcedField fieldPath="personal_context.family.parents" contactId={contactId} showIndicator={true}>
                        <Typography variant="body2"><strong>Parents:</strong> {family.parents}</Typography>
                    </SourcedField>
                </Box>
            )}
            {family.siblings && (
                 <Box mt={1}>
                    <SourcedField fieldPath="personal_context.family.siblings" contactId={contactId} showIndicator={true}>
                        <Typography variant="body2"><strong>Siblings:</strong> {family.siblings}</Typography>
                    </SourcedField>
                </Box>
            )}
          </Box>
        )}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Interests</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {interests.map((interest, index) => (
                <SourcedField key={`interest-${index}`} fieldPath={`personal_context.interests.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                  <Chip label={interest} size="small" />
                </SourcedField>
              ))}
            </Box>
          </Box>
        )}

        {/* Values */}
        {values && values.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Values</Typography>
            <Typography component="div" variant="body2">
              {values.map((value, index) => (
                <SourcedField key={`value-${index}`} fieldPath={`personal_context.values.${index}`} contactId={contactId} showIndicator={false} compact={true} className="inline mr-1">
                  <Typography component="span">{value}</Typography>
                  {index < values.length - 1 && ", "}
                </SourcedField>
              ))}
            </Typography>
          </Box>
        )}
        
        {/* Key Life Events */}
        {key_life_events && key_life_events.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Key Life Events</Typography>
            <List dense disablePadding>
              {key_life_events.map((event: string, index: number) => (
                <ListItem key={`kle-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.key_life_events.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={event} />
                  </SourcedField>
                </ListItem>
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
                  <SourcedField fieldPath={`personal_context.milestones.${index}.event`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText 
                      primary={`${milestone.emoji ? milestone.emoji + ' ' : ''}${milestone.event}`}
                      secondary={milestone.date ? `${milestone.date}${milestone.impact ? ' (Impact: ' + milestone.impact + ')' : ''}` : milestone.impact ? `Impact: ${milestone.impact}` : null}
                    />
                  </SourcedField>
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
                <ListItem key={index} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.anecdotes.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={anecdote} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Current Challenges */}
        {current_challenges && current_challenges.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Current Challenges</Typography>
            <List dense disablePadding>
              {current_challenges.map((challenge: string, index: number) => (
                <ListItem key={`cc-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.current_challenges.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={challenge} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Upcoming Changes */}
        {upcoming_changes && upcoming_changes.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Upcoming Changes</Typography>
            <List dense disablePadding>
              {upcoming_changes.map((change: string, index: number) => (
                <ListItem key={`uc-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.upcoming_changes.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={change} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Living Situation */}
        {living_situation && (
          <Box mb={2}>
            <SourcedField fieldPath="personal_context.living_situation" contactId={contactId} showIndicator={true}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Living Situation</Typography>
              <Typography variant="body2">{living_situation}</Typography>
            </SourcedField>
          </Box>
        )}

        {/* Hobbies */}
        {hobbies && hobbies.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Hobbies</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {hobbies.map((hobby: string, index: number) => (
                <SourcedField key={`hobby-${index}`} fieldPath={`personal_context.hobbies.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                  <Chip label={hobby} size="small" />
                </SourcedField>
              ))}
            </Box>
          </Box>
        )}

        {/* Travel Plans */}
        {travel_plans && travel_plans.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Travel Plans</Typography>
            <List dense disablePadding>
              {travel_plans.map((plan: string, index: number) => (
                <ListItem key={`tp-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.travel_plans.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={plan} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Motivations */}
        {motivations && motivations.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Motivations</Typography>
            <List dense disablePadding>
              {motivations.map((motivation: string, index: number) => (
                <ListItem key={`motiv-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.motivations.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={motivation} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Education */}
        {typeof education === 'string' && education && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Education</Typography>
            <SourcedField fieldPath="personal_context.education" contactId={contactId} showIndicator={true}>
              <Typography variant="body2">{education}</Typography>
            </SourcedField>
          </Box>
        )}
        {Array.isArray(education) && education.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Education</Typography>
            <List dense disablePadding>
              {education.map((edu: string, index: number) => (
                <ListItem key={`edu-${index}`} sx={{pl:1}}>
                  <SourcedField fieldPath={`personal_context.education.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={edu} />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Communication Style */}
        {communication_style && (
          <Box mb={2}>
            <SourcedField fieldPath="personal_context.communication_style" contactId={contactId} showIndicator={true}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Communication Style</Typography>
              <Typography variant="body2">{communication_style}</Typography>
            </SourcedField>
          </Box>
        )}

        {/* Relationship Goal */}
        {relationship_goal && (
          <Box mb={2}>
            <SourcedField fieldPath="personal_context.relationship_goal" contactId={contactId} showIndicator={true}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>My Relationship Goal</Typography>
              <Typography variant="body2">{relationship_goal}</Typography>
            </SourcedField>
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
                                <ListItem key={`personal-starter-${index}`} sx={{pl:1}}>
                                  <SourcedField fieldPath={`personal_context.conversation_starters.personal.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                                    <ListItemText primary={starter} />
                                  </SourcedField>
                                </ListItem>
                            ))}
                        </List>
                     </Box>
                 )}
                 {conversation_starters.professional && conversation_starters.professional.length > 0 && (
                     <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Professional:</Typography>
                        <List dense disablePadding>
                            {conversation_starters.professional.map((starter, index) => (
                                <ListItem key={`prof-starter-${index}`} sx={{pl:1}}>
                                  <SourcedField fieldPath={`personal_context.conversation_starters.professional.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                                    <ListItemText primary={starter} />
                                  </SourcedField>
                                </ListItem>
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