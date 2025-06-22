'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  Person, 
  Edit,
  Save,
  Cancel,
  ExpandMore,
  LinkedIn,
  RecordVoiceOver,
  Flag,
  Handshake,
  School,
  CheckCircle
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function ProfileScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { profile, profileCompletion, updateProfile, isUpdating } = useUserProfile();
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue || '' });
  };

  const handleSave = async (field: string) => {
    try {
      await updateProfile({ [field]: editValues[field] });
      setEditingField(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  if (!profile || !profileCompletion) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  const renderEditableField = (field: string, label: string, value: string, multiline = false) => {
    const isEditing = editingField === field;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          {!isEditing && (
            <IconButton 
              size="small" 
              onClick={() => handleEdit(field, value)}
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              value={editValues[field] || ''}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              multiline={multiline}
              rows={multiline ? 3 : 1}
              variant="outlined"
              size="small"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => handleSave(field)}
                disabled={isUpdating}
                color="primary"
              >
                <Save fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Typography variant="body1">
            {value || <em style={{ color: '#999' }}>Not set</em>}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Person color="primary" sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Your Networking Profile
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Review and customize your profile before completing onboarding
        </Typography>

        {/* Profile Completion */}
        <Alert 
          severity={profileCompletion.completion_percentage >= 70 ? 'success' : 'info'}
          icon={profileCompletion.completion_percentage >= 70 ? <CheckCircle /> : undefined}
          sx={{ mb: 4, textAlign: 'left' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Profile {profileCompletion.completion_percentage}% Complete
          </Typography>
          <Typography variant="body2">
            {profileCompletion.completion_percentage >= 70 
              ? 'Great! Your profile is ready for networking.'
              : `Complete ${profileCompletion.suggestions.slice(0, 2).join(' and ')} to improve your profile.`
            }
          </Typography>
        </Alert>
      </Box>

      {/* Content Cards */}
      <Stack spacing={3}>
        {/* Basic Information & Goals Row */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Basic Information */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  Basic Information
                </Typography>
                
                {renderEditableField('name', 'Name', profile.name || '')}
                {renderEditableField('title', 'Job Title', profile.title || '')}
                {renderEditableField('company', 'Company', profile.company || '')}
                {renderEditableField('email', 'Email', profile.email || '')}
              </CardContent>
            </Card>
          </Box>

          {/* Professional Goals */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Flag color="primary" />
                  Professional Goals
                </Typography>
                
                {renderEditableField('primary_goal', 'Primary Goal', profile.primary_goal || '')}
                {renderEditableField('goal_description', 'Goal Description', profile.goal_description || '', true)}
                {renderEditableField('goal_timeline', 'Timeline', profile.goal_timeline || '')}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Ways to Help Others */}
        {profile.ways_to_help_others?.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Handshake color="primary" />
                Ways You Can Help Others
                {profile.linkedin_analysis_completed_at && (
                  <Chip label="From LinkedIn" size="small" color="primary" variant="outlined" />
                )}
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {profile.ways_to_help_others.map((way, index) => (
                  <Chip 
                    key={index}
                    label={way}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Introduction Opportunities & Knowledge Row */}
        {(profile.introduction_opportunities?.length > 0 || profile.knowledge_to_share?.length > 0) && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Introduction Opportunities */}
            {profile.introduction_opportunities?.length > 0 && (
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkedIn color="primary" />
                      Introduction Opportunities
                    </Typography>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {profile.introduction_opportunities.map((opportunity, index) => (
                        <Chip 
                          key={index}
                          label={opportunity}
                          color="info"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Knowledge to Share */}
            {profile.knowledge_to_share?.length > 0 && (
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School color="primary" />
                      Knowledge to Share
                    </Typography>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {profile.knowledge_to_share.map((knowledge, index) => (
                        <Chip 
                          key={index}
                          label={knowledge}
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {/* Networking Challenges */}
        {profile.networking_challenges?.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RecordVoiceOver color="primary" />
                Networking Challenges
                <Chip label="From Voice Memo" size="small" color="primary" variant="outlined" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {profile.networking_challenges.map((challenge, index) => (
                  <Typography key={index} variant="body2" sx={{ pl: 2 }}>
                    • {challenge}
                  </Typography>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>

      <Divider sx={{ my: 4 }} />

      {/* Action Buttons */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
          disabled={isNavigating || isUpdating}
          sx={{ px: 6, py: 2 }}
        >
          Complete Onboarding
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          You can always edit your profile later from the dashboard
        </Typography>
      </Box>
    </Box>
  );
} 