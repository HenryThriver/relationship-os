'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Fade,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  CheckCircle, 
  People, 
  LinkedIn,
  ArrowForward
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface ImportedContact {
  id: string;
  name: string;
  linkedin_url: string;
  company?: string;
  title?: string;
  profile_picture?: string;
  headline?: string;
  recent_posts_count?: number;
}

export default function ContactConfirmationScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, state } = useOnboardingState();
  const { profile } = useUserProfile();
  
  const [showContent, setShowContent] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load the imported contacts from onboarding state
  useEffect(() => {
    const loadImportedContacts = async () => {
      try {
        if (state?.imported_goal_contacts && state.imported_goal_contacts.length > 0) {
          // Use real imported contacts data
          setImportedContacts(state.imported_goal_contacts);
        } else if (state?.goal_contact_urls && state.goal_contact_urls.length > 0) {
          // Fallback: Create display data from URLs if contacts data not available
          const fallbackContacts: ImportedContact[] = state.goal_contact_urls.map((url, index) => {
            const urlMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
            const urlSlug = urlMatch ? urlMatch[1] : `contact-${index + 1}`;
            const displayName = urlSlug
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())
              .replace(/\d+/g, ''); // Remove numbers

            return {
              id: `imported-${index}`,
              name: displayName || `Contact ${index + 1}`,
              linkedin_url: url,
              company: 'LinkedIn Analysis Pending',
              title: 'Profile Analysis Pending'
            };
          });
          setImportedContacts(fallbackContacts);
        }
      } catch (error) {
        console.error('Error loading imported contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImportedContacts();
  }, [state?.imported_goal_contacts, state?.goal_contact_urls]);

  const handleContinue = async () => {
    try {
      // Mark this screen as complete
      await completeScreen(currentScreen);
      
      // Move to next screen (LinkedIn Analysis)
      await nextScreen();
    } catch (error) {
      console.error('Error continuing to next screen:', error);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <Typography variant="h6" color="text.secondary">
          Processing your goal contacts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      py: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
          
          {/* Success Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main',
                  opacity: 0.9
                }} 
              />
            </Box>
            
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 500,
                lineHeight: 1.3,
                color: '#1a1a1a',
                mb: 2
              }}
            >
              🎯 Goal & Contacts Confirmed!
            </Typography>

            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.4,
                mb: 4
              }}
            >
              We've successfully imported your goal-related contacts.
            </Typography>
          </Box>

          {/* Goal Display */}
          {profile?.primary_goal && (
            <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f0f9ff' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark', fontWeight: 500 }}>
                  Your Goal
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {profile.primary_goal}
                </Typography>
                {profile.goal_description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                    {profile.goal_description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Imported Contacts */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <People color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Goal-Related Contacts ({importedContacts.length})
                </Typography>
              </Box>
              
              {importedContacts.length > 0 ? (
                <List sx={{ width: '100%' }}>
                  {importedContacts.map((contact, index) => (
                    <React.Fragment key={contact.id}>
                      <ListItem sx={{ px: 0, py: 3, alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ mr: 3 }}>
                          {contact.profile_picture ? (
                            <Avatar
                              src={contact.profile_picture}
                              alt={`${contact.name} profile`}
                              sx={{ 
                                width: 72,
                                height: 72,
                                border: '3px solid',
                                borderColor: 'primary.main',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.style.backgroundColor = '#1976d2';
                                  parent.textContent = getInitials(contact.name);
                                  parent.style.color = 'white';
                                  parent.style.fontSize = '1.2rem';
                                }
                              }}
                            />
                          ) : (
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 72,
                                height: 72,
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                            >
                              {getInitials(contact.name)}
                            </Avatar>
                          )}
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {contact.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {/* Company and Title */}
                              {(contact.company || contact.title) && (
                                <Typography variant="body1" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                                  {contact.title && contact.company ? `${contact.title} at ${contact.company}` :
                                   contact.title ? contact.title :
                                   contact.company ? `Works at ${contact.company}` : ''}
                                </Typography>
                              )}
                              
                              {/* Headline */}
                              {contact.headline && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 1.5,
                                    fontStyle: 'italic',
                                    opacity: 0.9,
                                    lineHeight: 1.4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '400px'
                                  }}
                                >
                                  "{contact.headline}"
                                </Typography>
                              )}
                              
                              {/* LinkedIn Activity */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <LinkedIn sx={{ fontSize: 18, color: '#0077b5' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {typeof contact.recent_posts_count === 'number' && contact.recent_posts_count > 0
                                    ? `${contact.recent_posts_count} posts in last 3 months • Profile imported`
                                    : 'Profile imported • Posts analysis pending'
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <Chip 
                          label="Associated with Goal" 
                          color="success" 
                          variant="outlined"
                          size="small"
                        />
                      </ListItem>
                      {index < importedContacts.length - 1 && (
                        <Divider component="li" sx={{ my: 1 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No contacts were imported. You can add contacts later.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Next Steps Info */}
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#fafafa' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                What happens next?
              </Typography>
              
              <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                  🔍 <strong>LinkedIn Analysis:</strong> We'll analyze these contacts' profiles and posts
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                  📧 <strong>Email Discovery:</strong> Cross-reference with your Gmail for existing relationships
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                  🤝 <strong>Relationship Intelligence:</strong> Generate insights and connection strategies
                </Typography>
                <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                  📋 <strong>Action Plan:</strong> Get personalized networking recommendations
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={isNavigating}
              endIcon={<ArrowForward />}
              sx={{ 
                px: 6, 
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {isNavigating ? 'Processing...' : 'Continue to LinkedIn Analysis'}
            </Button>
          </Box>

          {/* Inspirational Quote */}
          <Box sx={{ 
            textAlign: 'center',
            borderTop: '1px solid #e0e0e0',
            pt: 4
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic',
                color: '#666',
                lineHeight: 1.6,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              "Your network is your net worth, but relationships are your real wealth."
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#999',
                mt: 1,
                display: 'block',
                letterSpacing: '0.5px'
              }}
            >
              — Porter Gale
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 