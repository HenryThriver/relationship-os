import React from 'react';
import { Box, Typography, Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip } from '@mui/material';
import type { Contact, ProfessionalContext as ProfessionalContextType, Mentions } from '@/types';

interface ProfessionalContextProps {
  professionalContext: ProfessionalContextType | undefined;
}

export const ProfessionalContextDisplay: React.FC<ProfessionalContextProps> = ({ professionalContext }) => {
  if (!professionalContext) {
    return null;
  }

  const { 
    goals, 
    background, 
    current_ventures, 
    speaking_topics, 
    achievements, 
    // New fields
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
  const renderListItems = (items: string[] | undefined, title: string) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
        <List dense disablePadding>
          {items.map((item: string, index: number) => (
            <ListItem key={index} sx={{ pl: 1 }}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Helper function to render string fields
  const renderStringField = (item: string | undefined, title: string) => {
    if (!item) return null;
    return (
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ pl: 1 }}>{item}</Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader 
        title={<Typography variant="h6">Professional Snapshot</Typography>}
      />
      <CardContent>
        {/* Current Role Description - NEW */}
        {renderStringField(current_role_description, 'Current Role Description')}

        {/* Key Responsibilities - NEW */}
        {renderListItems(key_responsibilities, 'Key Responsibilities')}

        {/* Team Details - NEW */}
        {renderStringField(team_details, 'Team Details')}

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
                  {background.expertise_areas.map((area: string, index: number) => (
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
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Key Achievements
            </Typography>
            <List dense disablePadding>
              {achievements.map((ach, index: number) => (
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

        {/* Work Challenges - NEW */}
        {renderListItems(work_challenges, 'Work Challenges')}

        {/* Networking Objectives - NEW */}
        {renderListItems(networking_objectives, 'Networking Objectives')}

        {/* Skill Development - NEW */}
        {renderListItems(skill_development, 'Skill Development')}

        {/* Career Transitions - NEW */}
        {renderListItems(career_transitions, 'Career Transitions')}

        {/* Projects Involved - NEW */}
        {renderListItems(projects_involved, 'Projects Involved')}

        {/* Collaborations - NEW */}
        {renderListItems(collaborations, 'Collaborations')}

        {/* Upcoming Projects - NEW */}
        {renderListItems(upcoming_projects, 'Upcoming Projects')}

        {/* Skills - NEW */}
        {skills && skills.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, pl:1 }}>
              {skills.map((skill: string, index: number) => (
                <Chip key={`skill-${index}`} label={skill} size="small" />
              ))}
            </Box>
          </Box>
        )}

        {/* Industry Knowledge - NEW */}
        {renderListItems(industry_knowledge, 'Industry Knowledge')}
        
        {/* Mentions - NEW */}
        {mentions && Object.keys(mentions).length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mentions</Typography>
            {Object.entries(mentions).map(([key, valueList]) => {
              if (valueList && valueList.length > 0) {
                // Make key more readable: e.g., 'industry_contacts' -> 'Industry Contacts'
                const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <Box key={key} mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', pl:1 }}>{title}:</Typography>
                    <List dense disablePadding sx={{pl:2}}>
                      {(valueList as string[]).map((item: string, index: number) => (
                        <ListItem key={`${key}-${index}`} sx={{pl:1}}>
                           <ListItemText primary={item} />
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
        {renderListItems(opportunities_to_help, 'Opportunities to Help')}

        {/* Introduction Needs - NEW */}
        {renderListItems(introduction_needs, 'Introduction Needs')}

        {/* Resource Needs - NEW */}
        {renderListItems(resource_needs, 'Resource Needs')}

        {/* Pending Requests - NEW */}
        {renderListItems(pending_requests, 'Pending Requests')}

        {/* Collaboration Opportunities - NEW */}
        {renderListItems(collaboration_opportunities, 'Collaboration Opportunities')}

      </CardContent>
    </Card>
  );
}; 