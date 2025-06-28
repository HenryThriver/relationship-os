'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Card,
  CardContent,
  Alert,
  Fade,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  People, 
  LinkedIn, 
  Add,
  Delete,
  CheckCircle,
  Help
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface ContactInput {
  id: string;
  url: string;
  isValid: boolean;
  error?: string;
}

export default function ContactImportScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, updateState } = useOnboardingState();
  const { profile } = useUserProfile();
  
  const [showContent, setShowContent] = useState(false);
  const [contacts, setContacts] = useState<ContactInput[]>([
    { id: '1', url: '', isValid: false },
    { id: '2', url: '', isValid: false },
    { id: '3', url: '', isValid: false }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const linkedinUrlPattern = /linkedin\.com\/in\/[^\/\?\s]+/i;
    return linkedinUrlPattern.test(url);
  };

  const updateContact = (id: string, url: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id 
        ? { 
            ...contact, 
            url: url.trim(),
            isValid: validateLinkedInUrl(url.trim()),
            error: url.trim() && !validateLinkedInUrl(url.trim()) ? 'Please enter a valid LinkedIn profile URL' : undefined
          }
        : contact
    ));
  };

  const addContact = () => {
    if (contacts.length < 5) {
      const newId = (contacts.length + 1).toString();
      setContacts(prev => [...prev, { id: newId, url: '', isValid: false }]);
    }
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter(contact => contact.id !== id));
    }
  };

  const getValidContacts = () => {
    return contacts.filter(contact => contact.isValid);
  };

  const handleAnalyzeContacts = async () => {
    const validContacts = getValidContacts();
    
    if (validContacts.length === 0) {
      setError('Please add at least one valid LinkedIn profile URL');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Store the LinkedIn URLs in onboarding state
      const contactUrls = validContacts.map(contact => contact.url);
      
      await updateState({
        goal_contact_urls: contactUrls
      });

      // Import contacts via API for immediate processing
      const response = await fetch('/api/contacts/goal-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedin_urls: contactUrls
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to import contacts');
      }

      // Store imported contacts data for confirmation screen
      await updateState({
        imported_goal_contacts: result.contacts
      });

      console.log('Goal contacts imported:', {
        urls: contactUrls,
        count: result.contacts_created,
        contacts: result.contacts,
        goal: profile?.primary_goal
      });
      
      // Mark this screen as complete
      await completeScreen(currentScreen);
      
      // Move to next screen (LinkedIn Analysis)
      await nextScreen();
      
    } catch (err) {
      console.error('Error importing goal contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to import contacts. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isNavigating || isProcessing;
  const validContactCount = getValidContacts().length;

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
          
          {/* Goal Acknowledgment */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <People 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  opacity: 0.9
                }} 
              />
            </Box>
            
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#1a1a1a',
                mb: 3
              }}
            >
              Perfect! Here's your goal:
            </Typography>

            {profile?.primary_goal && (
              <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f0f9ff' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>🎯</Typography>
                    <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                      {profile.primary_goal}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 300,
                lineHeight: 1.4,
                mb: 2
              }}
            >
              Now let's identify 1-3 people related to this goal.
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                lineHeight: 1.6,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Think about anyone who could help, inspire, or guide you toward this goal—
              whether you've never interacted with them, occasionally stay in touch, 
              or they're your absolute closest friend.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Contact Input Fields */}
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                LinkedIn Profile URLs
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {contacts.map((contact, index) => (
                  <Box key={contact.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      label={`LinkedIn Profile ${index + 1}`}
                      placeholder="https://linkedin.com/in/username"
                      value={contact.url}
                      onChange={(e) => updateContact(contact.id, e.target.value)}
                      error={!!contact.error}
                      helperText={contact.error}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkedIn color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: contact.isValid ? (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        ) : null
                      }}
                    />
                    
                    {contacts.length > 1 && (
                      <IconButton 
                        onClick={() => removeContact(contact.id)}
                        disabled={isLoading}
                        sx={{ mt: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>

              {contacts.length < 5 && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={addContact}
                    disabled={isLoading}
                    startIcon={<Add />}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Another Contact
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Guidance Section */}
          <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#fafafa' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Help color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Need suggestions? Think about:
                </Typography>
              </Box>
              
              <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  Someone who's achieved what you want
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  Someone in your target industry/company
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  Someone who could make introductions
                </Typography>
                <Typography component="li" variant="body1" sx={{ lineHeight: 1.6 }}>
                  A mentor, advisor, or industry expert
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: 'italic' }}>
                Don't worry about having the "perfect" people—we're going to show you 
                how systematic relationship intelligence works with whoever you choose.
              </Typography>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            {validContactCount > 0 && (
              <Chip 
                label={`${validContactCount} contact${validContactCount !== 1 ? 's' : ''} ready`}
                color="success"
                sx={{ mb: 3, fontSize: '0.9rem' }}
              />
            )}
            
            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyzeContacts}
              disabled={isLoading || validContactCount === 0}
              sx={{ 
                px: 6, 
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {isLoading ? 'Fetching LinkedIn profiles & posts...' : 'Analyze these contacts'}
            </Button>
          </Box>

          {/* Steve Jobs Quote */}
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
              "Great things in business are never done by one person. They're done by a team of people."
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
              — Steve Jobs
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
} 