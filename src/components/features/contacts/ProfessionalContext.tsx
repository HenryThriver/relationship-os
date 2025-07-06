import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip } from '@mui/material';
import type { ProfessionalContext as ProfessionalContextType } from '@/types';
import { SourcedField } from '@/components/ui/SourceAttribution';

interface ProfessionalContextProps {
  professionalContext: ProfessionalContextType | undefined;
  contactId: string;
}

export const ProfessionalContextDisplay: React.FC<ProfessionalContextProps> = ({ professionalContext, contactId }) => {
  if (!professionalContext) {
    return null;
  }

  const { 
    current_role,
    current_company,
    goals, 
    background, 
    current_ventures, 
    speaking_topics, 
    achievements, 
    current_role_description,
    key_responsibilities,
    team_details,
    work_challenges,
    networking_objectives,
    skill_development,
    career_transitions,
    projects_involved,
    collaborations,
    upcoming_projects,
    skills,
    industry_knowledge,
    mentions,
    opportunities_to_help,
    introduction_needs,
    resource_needs,
    pending_requests,
    collaboration_opportunities
  } = professionalContext;

  // Helper function to render array fields as lists
  const renderListItems = (items: string[] | undefined, title: string, fieldPathPrefix: string) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
        <List dense disablePadding>
          {items.map((item: string, index: number) => (
            <ListItem key={index} sx={{ pl: 1 }}>
              <SourcedField fieldPath={`${fieldPathPrefix}.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                <ListItemText primary={item} />
              </SourcedField>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Helper function to render string fields
  const renderStringField = (item: string | undefined, title: string, fieldPath: string) => {
    if (!item) return null;
    return (
      <Box mb={2}>
        <SourcedField fieldPath={fieldPath} contactId={contactId} showIndicator={true}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ pl: 1 }}>{item}</Typography>
        </SourcedField>
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader 
        title={<Typography variant="h6">Professional Snapshot</Typography>}
      />
      <CardContent>
        {/* Example of SourcedField for top-level direct properties */}
        {current_role && (
          <Box mb={2}>
            <SourcedField fieldPath="professional_context.current_role" contactId={contactId} showIndicator={true}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Current Role
              </Typography>
              <Typography variant="body2" sx={{ pl: 1 }}>{current_role} {current_company && `at ${current_company}`}</Typography>
            </SourcedField>
          </Box>
        )}

        {/* Current Role Description - NEW */}
        {renderStringField(current_role_description, 'Current Role Description', 'professional_context.current_role_description')}

        {/* Key Responsibilities - NEW */}
        {renderListItems(key_responsibilities, 'Key Responsibilities', 'professional_context.key_responsibilities')}

        {/* Team Details - NEW */}
        {renderStringField(team_details, 'Team Details', 'professional_context.team_details')}

        {/* Current Goals */}
        {goals && goals.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Goals
            </Typography>
            <List dense disablePadding>
              {goals.map((goal, index) => (
                <ListItem key={index} sx={{ pl: 1 }}>
                  <SourcedField fieldPath={`professional_context.goals.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText primary={goal} />
                  </SourcedField>
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
                <SourcedField fieldPath="professional_context.background.focus_areas" contactId={contactId} showIndicator={true}>
                  <Typography variant="body2" paragraph><strong>Focus:</strong> {background.focus_areas}</Typography>
                </SourcedField>
            )}
            {background.previous_companies && background.previous_companies.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Previous Companies:</Typography>
                 <List dense disablePadding sx={{pl:1}}>
                    {background.previous_companies.map((company, index) => (
                        <ListItem key={`prev_comp_${index}`} sx={{pl:0, pt:0, pb:0}}>
                            <SourcedField fieldPath={`professional_context.background.previous_companies.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                                <ListItemText primary={company} primaryTypographyProps={{variant: 'body2'}} />
                            </SourcedField>
                        </ListItem>
                    ))}
                 </List>
              </Box>
            )}
            {background.expertise_areas && background.expertise_areas.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Expertise Areas:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl:1 }}>
                  {background.expertise_areas.map((area: string, index: number) => (
                    <SourcedField key={`exp_area_${index}`} fieldPath={`professional_context.background.expertise_areas.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                        <Chip label={area} size="small" />
                    </SourcedField>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Current Ventures */}
        {current_ventures && (
           renderStringField(current_ventures, 'Current Ventures', 'professional_context.current_ventures')
        )}
        
        {/* Speaking Topics */}
        {speaking_topics && speaking_topics.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Speaking Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {speaking_topics.map((topic, index) => (
                 <SourcedField key={`speak_topic_${index}`} fieldPath={`professional_context.speaking_topics.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <Chip label={topic} size="small" variant="outlined" />
                 </SourcedField>
              ))}
            </Box>
          </Box>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Key Achievements
            </Typography>
            <List dense disablePadding>
              {achievements.map((ach, index: number) => (
                <ListItem key={index} sx={{ display: 'block', pl: 1 }}>
                  <SourcedField fieldPath={`professional_context.achievements.${index}.event`} contactId={contactId} showIndicator={false} compact={true}>
                    <ListItemText 
                      primary={ach.event}
                      secondary={ach.date ? `${ach.date}${ach.details ? ' - ' + ach.details : ''}` : ach.details}
                    />
                  </SourcedField>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Work Challenges - NEW */}
        {renderListItems(work_challenges, 'Work Challenges', 'professional_context.work_challenges')}

        {/* Networking Objectives - NEW */}
        {renderListItems(networking_objectives, 'Networking Objectives', 'professional_context.networking_objectives')}

        {/* Skill Development - NEW */}
        {renderListItems(skill_development, 'Skill Development', 'professional_context.skill_development')}

        {/* Career Transitions - NEW */}
        {renderListItems(career_transitions, 'Career Transitions', 'professional_context.career_transitions')}

        {/* Projects Involved - NEW */}
        {renderListItems(projects_involved, 'Projects Involved', 'professional_context.projects_involved')}

        {/* Collaborations - NEW */}
        {renderListItems(collaborations, 'Collaborations', 'professional_context.collaborations')}

        {/* Upcoming Projects - NEW */}
        {renderListItems(upcoming_projects, 'Upcoming Projects', 'professional_context.upcoming_projects')}

        {/* Skills - NEW */}
        {skills && skills.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl:1 }}>
              {skills.map((skill: string, index: number) => (
                 <SourcedField key={`skill_${index}`} fieldPath={`professional_context.skills.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                    <Chip label={skill} size="small" />
                 </SourcedField>
              ))}
            </Box>
          </Box>
        )}

        {/* Industry Knowledge - NEW */}
        {renderListItems(industry_knowledge, 'Industry Knowledge', 'professional_context.industry_knowledge')}
        
        {/* Mentions - NEW */}
        {mentions && Object.keys(mentions).length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mentions</Typography>
            {Object.entries(mentions).map(([key, valueList]) => {
              if (valueList && Array.isArray(valueList) && valueList.length > 0) {
                const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <Box key={key} mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', pl:1 }}>{title}:</Typography>
                    <List dense disablePadding sx={{pl:2}}>
                      {(valueList as string[]).map((item: string, index: number) => (
                        <ListItem key={`${key}-${index}`} sx={{pl:1, pt:0, pb:0}}>
                           <SourcedField fieldPath={`professional_context.mentions.${key}.${index}`} contactId={contactId} showIndicator={false} compact={true}>
                                <ListItemText primary={item} primaryTypographyProps={{variant: 'body2'}}/>
                           </SourcedField>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                );
              }
              return null;
            })}
          </Box>
        )}

        {/* Opportunities to Help - NEW */}
        {renderListItems(opportunities_to_help, 'Opportunities to Help', 'professional_context.opportunities_to_help')}

        {/* Introduction Needs - NEW */}
        {renderListItems(introduction_needs, 'Introduction Needs', 'professional_context.introduction_needs')}

        {/* Resource Needs - NEW */}
        {renderListItems(resource_needs, 'Resource Needs', 'professional_context.resource_needs')}

        {/* Pending Requests - NEW */}
        {renderListItems(pending_requests, 'Pending Requests', 'professional_context.pending_requests')}

        {/* Collaboration Opportunities - NEW */}
        {renderListItems(collaboration_opportunities, 'Collaboration Opportunities', 'professional_context.collaboration_opportunities')}

      </CardContent>
    </Card>
  );
}; 