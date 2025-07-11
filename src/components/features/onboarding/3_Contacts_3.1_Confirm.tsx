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
  IconButton,
  TextField,
  Stack
} from '@mui/material';
import { 
  People, 
  LinkedIn,
  ArrowForward,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { PremiumCard, InsightCard, ExecutiveButton } from '@/components/ui/premium';

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

interface VoiceMemoInsightProps {
  contact: ImportedContact;
}

const VoiceMemoInsight: React.FC<VoiceMemoInsightProps> = ({ contact }) => {
  const { data: voiceMemoInsight } = useQuery({
    queryKey: ['voiceMemoInsight', contact.id],
    queryFn: async () => {
          // Query for voice memo insights
      
      // Find by contact_id and profile_enhancement memo type
      const { data, error } = await supabase
        .from('artifacts')
        .select('content, metadata, transcription, ai_processing_completed_at')
        .eq('type', 'voice_memo')
        .eq('contact_id', contact.id)
        .contains('metadata', { memo_type: 'profile_enhancement' })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error querying voice memo:', error);
      }

      // Return the voice memo if found
      if (data && data.length > 0) {
        return data[0];
      }
      
      if (error || !data || data.length === 0) return null;
      return data[0];
    },
    enabled: !!contact.id
  });

  // Check if we have a relationship summary from AI processing
  const relationshipSummary = (voiceMemoInsight?.metadata as { relationship_summary?: string })?.relationship_summary;
  
  // Fallback to transcript if no summary yet (processing may still be in progress)
  const fallbackInsight = voiceMemoInsight?.transcription || 
                          (typeof voiceMemoInsight?.content === 'string' ? voiceMemoInsight.content : null);

      // Determine which insight to display

  // Show relationship summary if available, otherwise show processing status or fallback
  if (relationshipSummary) {
    return (
      <Box 
        component="span"
        sx={{ 
          display: 'block',
          mt: 1, 
          p: 1, 
          backgroundColor: 'grey.50', 
          borderRadius: 1,
          fontSize: '0.875rem',
          lineHeight: 1.43
        }}
      >
        <Box component="span" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box component="span" sx={{ color: 'primary.main', fontSize: '1rem' }}>💡</Box>
          <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {relationshipSummary}
          </Box>
        </Box>
      </Box>
    );
  }

  // Show processing status if AI processing is in progress
  if (voiceMemoInsight && !voiceMemoInsight.ai_processing_completed_at) {
    return (
      <Box 
        component="span"
        sx={{ 
          display: 'block',
          mt: 1, 
          p: 1, 
          backgroundColor: 'info.light', 
          borderRadius: 1,
          fontSize: '0.875rem',
          lineHeight: 1.43
        }}
      >
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ fontSize: '1rem' }}>⏳</Box>
          <Box component="span" sx={{ fontStyle: 'italic', color: 'info.contrastText' }}>
            Processing relationship insights...
          </Box>
        </Box>
      </Box>
    );
  }

  // Show fallback insight if available but no summary yet
  if (fallbackInsight && fallbackInsight.length > 200) {
    // Show truncated version with expand option for long transcripts
    return (
      <Box 
        component="span"
        sx={{ 
          display: 'block',
          mt: 1, 
          p: 1, 
          backgroundColor: 'grey.50', 
          borderRadius: 1,
          fontSize: '0.875rem',
          lineHeight: 1.43
        }}
      >
        <Box component="span" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box component="span" sx={{ color: 'primary.main', fontSize: '1rem' }}>🎤</Box>
          <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {fallbackInsight.substring(0, 200)}...
          </Box>
        </Box>
      </Box>
    );
  }

  // Show short fallback insight as-is
  if (fallbackInsight) {
    return (
      <Box 
        component="span"
        sx={{ 
          display: 'block',
          mt: 1, 
          p: 1, 
          backgroundColor: 'grey.50', 
          borderRadius: 1,
          fontSize: '0.875rem',
          lineHeight: 1.43
        }}
      >
        <Box component="span" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box component="span" sx={{ color: 'primary.main', fontSize: '1rem' }}>🎤</Box>
          <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {fallbackInsight}
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};

export default function ContactConfirmationScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating, state } = useOnboardingState();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [showContent, setShowContent] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Goal editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoalText, setEditedGoalText] = useState('');
  const [editedGoalDescription, setEditedGoalDescription] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

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
      // Associate imported contacts with the existing goal
      if (state?.goal_id && importedContacts.length > 0) {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            associate_contacts_with_goal: true,
            goal_id: state.goal_id,
            imported_contacts: importedContacts.map(contact => ({ id: contact.id }))
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to associate contacts with goal:', errorData.error);
          // Don't fail the whole operation
        } else {
          const result = await response.json();
          console.log('Contacts associated with goal successfully:', result);
        }
      }

      // Mark this screen as complete
      await completeScreen(currentScreen);
      
      // Move to next screen (LinkedIn Analysis)
      await nextScreen();
    } catch (error) {
      console.error('Error associating contacts and continuing to next screen:', error);
      // Still try to continue even if contact association fails
      try {
        await completeScreen(currentScreen);
        await nextScreen();
      } catch (fallbackError) {
        console.error('Error in fallback navigation:', fallbackError);
      }
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

  const formatTextWithLineBreaks = (text: string) => {
    return (
      <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {text.split('\n').map((line, index) => (
          <Box 
            key={index} 
            component="div"
            sx={{ 
              mb: line.trim() === '' ? 1 : 0 // Add spacing for empty lines (paragraph breaks)
            }}
          >
            {line.trim() === '' ? '\u00A0' : line} {/* Non-breaking space for empty lines */}
          </Box>
        ))}
      </Box>
    );
  };

  const handleEditGoal = () => {
    // Set both fields separately
    setEditedGoalText(profile?.primary_goal || '');
    setEditedGoalDescription(profile?.goal_description || '');
    setIsEditingGoal(true);
  };

  const handleCancelEdit = () => {
    setIsEditingGoal(false);
    setEditedGoalText('');
    setEditedGoalDescription('');
  };

  const handleSaveGoal = async () => {
    if (!editedGoalText.trim()) return;
    
    setIsSavingGoal(true);
    try {
      // Update the existing goal record if we have a goal_id from state
      if (state?.goal_id) {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            update_existing_goal: true,
            goal_id: state.goal_id,
            title: editedGoalText.trim(),
            description: editedGoalDescription.trim() || null
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update goal');
        }

        console.log('Goal updated successfully');
      } else {
        // Fallback to updating profile if no goal_id (shouldn't happen in new flow)
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            primary_goal: editedGoalText.trim(),
            goal_description: editedGoalDescription.trim() || null
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update goal');
        }
      }

      // Invalidate the query to force a refetch
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
      
      setIsEditingGoal(false);
      setEditedGoalText('');
      setEditedGoalDescription('');
    } catch (error) {
      console.error('Error updating goal:', error);
      // Could add error toast here
    } finally {
      setIsSavingGoal(false);
    }
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
              Strategic Intelligence Activated
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
              Your relationship intelligence system is analyzing strategic connections.
            </Typography>
          </Box>

          {/* Goal Display */}
          {profile?.primary_goal && (
            <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#f0f9ff' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                    Your Goal
                  </Typography>
                  {!isEditingGoal && (
                    <IconButton 
                      onClick={handleEditGoal}
                      size="small"
                      sx={{ 
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'primary.50' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
                {isEditingGoal ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                        Main Goal
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editedGoalText}
                        onChange={(e) => setEditedGoalText(e.target.value)}
                        placeholder="Describe your primary goal headline..."
                        variant="outlined"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                        Additional Details (Optional)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editedGoalDescription}
                        onChange={(e) => setEditedGoalDescription(e.target.value)}
                        placeholder="Add more context about your goal, success criteria, timeline, or any other relevant details..."
                        variant="outlined"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white'
                          }
                        }}
                      />
                    </Box>
                    
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelEdit}
                        startIcon={<Cancel />}
                        disabled={isSavingGoal}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveGoal}
                        startIcon={<Save />}
                        disabled={isSavingGoal || !editedGoalText.trim()}
                      >
                        {isSavingGoal ? 'Saving...' : 'Save'}
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                      {profile.primary_goal}
                    </Typography>
                    {profile.goal_description && (
                      <Box sx={{ mt: 2 }}>
                        {formatTextWithLineBreaks(profile.goal_description)}
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Card */}
          {importedContacts.length > 0 && (
            <PremiumCard accent="sage">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <People sx={{ color: 'sage.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Strategic Connection Dossier
                </Typography>
              </Box>
                
                {/* Single Contact Display */}
                {importedContacts.map((contact) => (
                  <Box key={contact.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    {/* Avatar */}
                    <Box sx={{ flexShrink: 0 }}>
                      {contact.profile_picture ? (
                        <Avatar
                          src={contact.profile_picture}
                          alt={`${contact.name} profile`}
                          sx={{ 
                            width: 80,
                            height: 80,
                            border: '3px solid',
                            borderColor: 'sage.main',
                            boxShadow: '0 6px 16px rgba(5, 150, 105, 0.2)'
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
                              parent.style.fontSize = '1.4rem';
                            }
                          }}
                        />
                      ) : (
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 80,
                            height: 80,
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            boxShadow: '0 6px 16px rgba(25,118,210,0.2)'
                          }}
                        >
                          {getInitials(contact.name)}
                        </Avatar>
                      )}
                    </Box>
                    
                    {/* Contact Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Name and Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {contact.name}
                        </Typography>
                        <Chip 
                          label="Strategic Value: High" 
                          color="success" 
                          variant="filled"
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 24,
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          }}
                        />
                      </Box>
                      
                      {/* Company and Title */}
                      {(contact.company || contact.title) && (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500, 
                            color: 'text.primary',
                            fontSize: '1rem'
                          }}
                        >
                          {contact.title && contact.company ? `${contact.title} at ${contact.company}` :
                           contact.title ? contact.title :
                           contact.company ? `Works at ${contact.company}` : ''}
                        </Typography>
                      )}
                      
                      {/* Headline */}
                      {contact.headline && (
                        <Typography 
                          variant="body2"
                          sx={{ 
                            mb: 2,
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            lineHeight: 1.5,
                            fontSize: '0.9rem'
                          }}
                        >
                          &quot;{contact.headline}&quot;
                        </Typography>
                      )}
                      
                      {/* LinkedIn Activity */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LinkedIn sx={{ fontSize: 20, color: '#0077b5' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          {typeof contact.recent_posts_count === 'number' && contact.recent_posts_count > 0
                            ? `Active thought leader with ${contact.recent_posts_count} recent insights on LinkedIn`
                            : 'Profile analysis reveals key industry positioning'
                          }
                        </Typography>
                      </Box>
                      
                      {/* Strategic insight */}
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'sage.light', 
                        borderRadius: 2,
                        borderLeft: '3px solid',
                        borderLeftColor: 'sage.main',
                        mb: 2
                      }}>
                        <Typography variant="body2" sx={{ color: 'sage.dark', fontWeight: 500 }}>
                          Strategic Opportunity Detected
                        </Typography>
                                                 <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                           {typeof contact.recent_posts_count === 'number' && contact.recent_posts_count > 0
                             ? `Active thought leader with ${contact.recent_posts_count} recent insights on LinkedIn`
                             : 'Profile analysis reveals key industry positioning'
                           }
                        </Typography>
                      </Box>
                      
                      {/* Voice Memo Insight */}
                      <VoiceMemoInsight contact={contact} />
                    </Box>
                  </Box>
                ))}
            </PremiumCard>
          )}

          {/* Next Steps Info */}
          <InsightCard>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Your strategic intelligence gathering begins
            </Typography>
            
            <Box component="ul" sx={{ pl: 3, mb: 0, '& li': { mb: 1.5 } }}>
              <Typography component="li" variant="body1">
                <strong>Context Architecture:</strong> We'll map your existing relationship patterns
              </Typography>
              <Typography component="li" variant="body1">
                <strong>Professional Analysis:</strong> Your LinkedIn presence reveals strategic positioning  
              </Typography>
              <Typography component="li" variant="body1">
                <strong>Serendipity Design:</strong> Discover non-obvious connection opportunities
              </Typography>
            </Box>
          </InsightCard>

          {/* Continue Button */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <ExecutiveButton
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={isNavigating}
              endIcon={<ArrowForward />}
            >
              {isNavigating ? 'Analyzing strategic patterns...' : 'Continue intelligence gathering'}
            </ExecutiveButton>
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
              &quot;I&apos;m not good at networking&quot;
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