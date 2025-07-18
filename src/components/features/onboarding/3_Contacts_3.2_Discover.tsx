'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Fade,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Grid
} from '@mui/material';
import { 
  Email,
  CalendarToday,
  Add,
  Delete,
  CheckCircle,
  ArrowForward,
  Person
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration';
import { supabase } from '@/lib/supabase/client';

interface ContactWithEmails {
  id: string;
  name: string;
  profile_picture?: string;
  linkedin_url?: string;
  emails: string[];
  isAddingEmail: boolean;
  newEmail: string;
}

interface ServiceStats {
  emailsFound: number;
  meetingsFound: number;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
}

export default function ContextDiscoveryScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, state } = useOnboardingState();
  const { 
    isConnected: gmailConnected, 
    syncContactEmails
  } = useGmailIntegration();
  
  const [showContent, setShowContent] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [contacts, setContacts] = useState<ContactWithEmails[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isConnectingServices, setIsConnectingServices] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarExpired, setCalendarExpired] = useState(false);
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    emailsFound: 0,
    meetingsFound: 0,
    isAnalyzing: false,
    hasAnalyzed: false
  });

  // Use refs to avoid stale closures
  const calendarConnectedRef = useRef(false);
  const gmailConnectedRef = useRef(false);
  const contactsRef = useRef<ContactWithEmails[]>([]);
  const serviceStatsRef = useRef<ServiceStats>({
    emailsFound: 0,
    meetingsFound: 0,
    isAnalyzing: false,
    hasAnalyzed: false
  });

  // Update refs when state changes
  useEffect(() => {
    calendarConnectedRef.current = calendarConnected;
  }, [calendarConnected]);

  useEffect(() => {
    gmailConnectedRef.current = gmailConnected;
  }, [gmailConnected]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    serviceStatsRef.current = serviceStats;
  }, [serviceStats]);

  // Auto-analysis function that runs when services are connected
  const handleAutoAnalysis = useCallback(async () => {
    if (serviceStatsRef.current.isAnalyzing || serviceStatsRef.current.hasAnalyzed) {
      return;
    }
    
    setServiceStats(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      let emailsFound = 0;
      let meetingsFound = 0;

      // Sync emails for each contact if Gmail is connected
      if (gmailConnectedRef.current) {
        for (const contact of contactsRef.current) {
          if (contact.emails.length > 0) {
            try {
              const progress = await syncContactEmails({
                contact_id: contact.id,
                email_addresses: contact.emails,
                max_results: 50
              });
              emailsFound += progress.processed_emails;
            } catch (error) {
              console.error(`Error syncing emails for ${contact.name}:`, error);
            }
          }
        }
      }
      
      // Sync calendar if connected - use calendar sync API with 12-month historical range
      if (calendarConnectedRef.current) {
        try {
          // Calculate 12 months back for comprehensive onboarding sync
          const twelveMonthsAgo = new Date();
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
          
          const threeMonthsForward = new Date();
          threeMonthsForward.setMonth(threeMonthsForward.getMonth() + 3);
          
          const response = await fetch('/api/calendar/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              options: {
                startDate: twelveMonthsAgo.toISOString(),
                endDate: threeMonthsForward.toISOString(),
                maxResults: 500, // Higher limit for comprehensive sync
                includeDeclined: false,
                singleEvents: true
              }
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            meetingsFound = result.results?.artifactsCreated || 0;
          } else if (response.status === 401) {
            setCalendarConnected(false);
            const errorData = await response.json();
            console.error('Calendar sync failed - tokens expired:', errorData);
          } else {
            const errorText = await response.text();
            console.error('Calendar sync failed:', errorText);
          }
        } catch (error) {
          console.error('Error syncing calendar:', error);
        }
      }

      setServiceStats({
        emailsFound,
        meetingsFound,
        isAnalyzing: false,
        hasAnalyzed: true
      });

    } catch (error) {
      console.error('Error during auto-analysis:', error);
      setServiceStats(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [syncContactEmails]);

  // Load imported contacts from onboarding state and their existing emails
  useEffect(() => {
    const loadContacts = async () => {
      try {
        if (state?.imported_goal_contacts && state.imported_goal_contacts.length > 0) {
          const contactsWithEmails = await Promise.all(
            state.imported_goal_contacts.map(async (contact) => {
              // Load existing emails from database
              const { data: existingEmails } = await supabase
                .from('contact_emails')
                .select('email')
                .eq('contact_id', contact.id);
              
              return {
                id: contact.id,
                name: contact.name || 'Unknown',
                profile_picture: contact.profile_picture,
                linkedin_url: contact.linkedin_url,
                emails: existingEmails?.map((e: { email: string }) => e.email) || [],
                isAddingEmail: false,
                newEmail: ''
              };
            })
          );
          setContacts(contactsWithEmails);
        }
        setIsLoadingContacts(false);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setIsLoadingContacts(false);
      }
    };

    loadContacts();
  }, [state]);

  // Check calendar connection status
  useEffect(() => {
    const checkCalendarConnection = async () => {
      try {
        const response = await fetch('/api/calendar/sync');
        if (response.ok) {
          const data = await response.json();
          const isConnected = data.integration?.connected || false;
          setCalendarConnected(isConnected);
          if (isConnected) {
            setCalendarExpired(false); // Reset expired state when connected
          }
        } else if (response.status === 401) {
          setCalendarConnected(false);
          setCalendarExpired(true); // Mark as expired
        } else {
          setCalendarConnected(false);
        }
      } catch (error) {
        console.error('Error checking calendar connection:', error);
        setCalendarConnected(false);
      }
    };

    checkCalendarConnection();
    
    // Check connection status every 2 minutes to detect expired tokens
    const interval = setInterval(checkCalendarConnection, 120000);
    return () => clearInterval(interval);
  }, []);

  // Trigger animation sequence
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    
    const startAnimationSequence = () => {
      // Step 1: Header and subheader fade in
      setAnimationStep(1);
      
      // Step 2: Contacts section appears
      setTimeout(() => setAnimationStep(2), 1500);
    };

    setTimeout(startAnimationSequence, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Trigger comprehensive sync immediately after successful calendar connection
  useEffect(() => {
    if (calendarConnected && contacts.length > 0) {
      // Run comprehensive sync if we haven't analyzed yet
      if (!serviceStats.hasAnalyzed) {
        // Use setTimeout to avoid stale closure issues
        setTimeout(() => {
          handleAutoAnalysis();
        }, 100);
      }
    }
  }, [calendarConnected, handleAutoAnalysis, contacts.length, serviceStats.hasAnalyzed]);

  // Helper function to determine if we should show the services section
  const shouldShowServices = () => {
    return contacts.some(contact => contact.emails.length > 0);
  };

  // Helper function to determine if we should show the analysis section
  // const shouldShowAnalysis = () => {
  //   return shouldShowServices() && (gmailConnected || calendarConnected);
  // };

  // Helper function to determine if we have emails added (for enhanced styling)
  const hasEmailsAdded = () => {
    return contacts.some(contact => contact.emails.length > 0);
  };

  const handleAddEmail = async (contactId: string, email: string) => {
    if (!email.trim() || !email.includes('@')) return;

    try {
      // Add email to database
      const { error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contactId,
          email: email.trim(),
          email_type: 'other',
          is_primary: false
        });

      if (error) throw error;

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { 
              ...contact, 
              emails: [...contact.emails, email.trim()],
              isAddingEmail: false,
              newEmail: ''
            }
          : contact
      ));

      // Show services section if this is the first email added
      if (!shouldShowServices()) {
        setTimeout(() => setAnimationStep(3), 500);
      }

      // If services are already connected, re-run analysis with new email
      if (gmailConnected && serviceStats.hasAnalyzed) {
        setServiceStats(prev => ({ ...prev, hasAnalyzed: false }));
      }
    } catch (error) {
      console.error('Error adding email:', error);
    }
  };

  const handleRemoveEmail = async (contactId: string, emailIndex: number) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const emailToRemove = contact.emails[emailIndex];
    
    try {
      // Remove email from database
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('contact_id', contactId)
        .eq('email', emailToRemove);

      if (error) throw error;

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { 
              ...contact, 
              emails: contact.emails.filter((_, index) => index !== emailIndex)
            }
          : contact
      ));
    } catch (error) {
      console.error('Error removing email:', error);
    }
  };

  const toggleAddEmail = (contactId: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, isAddingEmail: !contact.isAddingEmail, newEmail: '' }
        : contact
    ));
  };

  const updateNewEmail = (contactId: string, email: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, newEmail: email }
        : contact
    ));
  };

  const handleConnectGmail = async () => {
    setIsConnectingServices(true);
    try {
      const response = await fetch('/api/gmail/auth?source=onboarding');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setIsConnectingServices(false);
    }
  };

  const handleConnectCalendar = async () => {
    setIsConnectingServices(true);
    try {
      const response = await fetch('/api/calendar/auth?source=onboarding');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setIsConnectingServices(false);
    }
  };

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  // Show analysis section when services are connected
  useEffect(() => {
    const hasEmails = contacts.some(contact => contact.emails.length > 0);
    const showAnalysis = hasEmails && (gmailConnected || calendarConnected);
    if (showAnalysis && animationStep < 4) {
      setAnimationStep(4);
    }
  }, [gmailConnected, calendarConnected, contacts, animationStep]);

  if (isLoadingContacts) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, pb: 4 }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          
          {/* Header */}
          {animationStep >= 1 && (
            <Fade in={true} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: '#1a1a1a',
                    mb: 2
                  }}
                >
                  Find your existing conversations and meetings
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6b7280', 
                    maxWidth: 600, 
                    mx: 'auto', 
                    lineHeight: 1.6,
                    fontSize: '1.1rem'
                  }}
                >
                  Connect Gmail and Calendar to surface your existing email threads and meeting history. 
                  See exactly how your relationships have developed over time.
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Contact Email Management */}
          {animationStep >= 2 && contacts.length > 0 && (
            <Fade in={true} timeout={1000}>
              <Card sx={{ 
                mb: 4, 
                borderRadius: 3, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e3f2fd'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    Contact Email Management
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add any additional email addresses you know for this contact to ensure we find all your communication history.
                  </Typography>

                  {/* Single Contact Display */}
                  {contacts.map((contact) => (
                    <Box key={contact.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      {/* Avatar */}
                      <Avatar 
                        src={contact.profile_picture}
                        sx={{ 
                          width: 64, 
                          height: 64,
                          border: '2px solid',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(25,118,210,0.15)'
                        }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </Avatar>

                      {/* Contact Info and Email Management */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {contact.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {contact.emails.length} email address{contact.emails.length !== 1 ? 'es' : ''} on file
                        </Typography>

                        {/* Email addresses */}
                        <Box sx={{ mb: 3 }}>
                          {contact.emails.map((email, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip 
                                label={email} 
                                color="primary" 
                                variant="outlined"
                                sx={{ 
                                  flex: 1,
                                  justifyContent: 'flex-start',
                                  maxWidth: '300px'
                                }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveEmail(contact.id, index)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>

                        {/* Add email form */}
                        {contact.isAddingEmail ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', maxWidth: '400px' }}>
                            <TextField
                              size="small"
                              placeholder="email@example.com"
                              value={contact.newEmail}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewEmail(contact.id, e.target.value)}
                              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  handleAddEmail(contact.id, contact.newEmail);
                                }
                              }}
                              sx={{ flex: 1 }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => handleAddEmail(contact.id, contact.newEmail)}
                              color="primary"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleAddEmail(contact.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => toggleAddEmail(contact.id)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            Add Another Email
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Service Connections - Only show after emails are added */}
          {shouldShowServices() && animationStep >= 3 && (
            <Fade in={true} timeout={1000}>
              <Card sx={{ 
                mb: 4, 
                borderRadius: 3, 
                boxShadow: hasEmailsAdded() ? '0 4px 20px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                border: hasEmailsAdded() ? '1px solid #e3f2fd' : '1px solid #f0f0f0',
                background: hasEmailsAdded() ? 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)' : 'white'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Connect Your Services
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Connect Gmail and Google Calendar to automatically find emails and meetings 
                    with your contacts. We&apos;ll show you exactly what we found.
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Gmail Connection */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Email sx={{ fontSize: 48, color: gmailConnected ? 'success.main' : 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Gmail
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Find email conversations and communication history
                          </Typography>
                          
                          {gmailConnected ? (
                            <Box>
                              <Chip label="Connected" color="success" icon={<CheckCircle />} sx={{ mb: 2 }} />
                              
                              {/* Show Gmail analysis results */}
                              {serviceStats.isAnalyzing && (
                                <Box sx={{ mt: 2 }}>
                                  <LinearProgress sx={{ mb: 1 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Scanning emails...
                                  </Typography>
                                </Box>
                              )}
                              
                              {serviceStats.hasAnalyzed && (
                                <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                                  <Typography variant="body2">
                                    Found <strong>{serviceStats.emailsFound}</strong> emails with your contacts
                                  </Typography>
                                </Alert>
                              )}
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={handleConnectGmail}
                              disabled={isConnectingServices}
                              startIcon={<Email />}
                            >
                              Connect Gmail
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Calendar Connection */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <CalendarToday sx={{ fontSize: 48, color: calendarConnected ? 'success.main' : 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Google Calendar
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Find meetings and scheduled interactions
                          </Typography>
                          
                          {calendarConnected ? (
                            <Box>
                              <Chip label="Connected" color="success" icon={<CheckCircle />} sx={{ mb: 2 }} />
                              
                              {/* Show Calendar analysis results */}
                              {serviceStats.isAnalyzing && (
                                <Box sx={{ mt: 2 }}>
                                  <LinearProgress sx={{ mb: 1 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Scanning meetings...
                                  </Typography>
                                </Box>
                              )}
                              
                              {serviceStats.hasAnalyzed && (
                                <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                                  <Typography variant="body2">
                                    Found <strong>{serviceStats.meetingsFound}</strong> meetings with your contacts
                                  </Typography>
                                </Alert>
                              )}
                            </Box>
                          ) : calendarExpired ? (
                            <Box>
                              <Chip label="Connection Expired" color="warning" sx={{ mb: 2 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Your calendar connection has expired. Please reconnect to scan for meetings.
                              </Typography>
                              <Button
                                variant="contained"
                                onClick={handleConnectCalendar}
                                disabled={isConnectingServices}
                                startIcon={<CalendarToday />}
                                color="warning"
                              >
                                Reconnect Calendar
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={handleConnectCalendar}
                              disabled={isConnectingServices}
                              startIcon={<CalendarToday />}
                            >
                              Connect Calendar
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Continue Button */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={isNavigating || serviceStats.isAnalyzing}
              endIcon={<ArrowForward />}
              sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
            >
              {serviceStats.hasAnalyzed ? 'Continue to Profile Analysis' : 'Continue to Profile Analysis'}
            </Button>
            
            {!shouldShowServices() && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                You can add contact emails and connect services later in Settings
              </Typography>
            )}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 