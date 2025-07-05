'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  CardHeader,
  Chip,
  TextField,
  IconButton,
  Avatar,
  Fade,
  Stack,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { 
  Person, 
  Edit,
  Save,
  Cancel,
  LinkedIn,
  Work,
  Psychology,
  ConnectWithoutContact,
  AutoFixHigh,
  Add,
  Close,
  RecordVoiceOver,
  Business,
  LocationOn,
  Email,
  Visibility,
  EmojiObjects,
  WorkOutline,
  TrendingUp,
  BusinessCenter,
  EmojiEvents,
  Handshake,
  School,
  Flag
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import type { PersonalContext, ProfessionalContext } from '@/types/contact';

interface ProfessionalContextData {
  professional_brief?: string;
  unique_value_proposition?: string;
  zone_of_genius?: string;
  writing_voice?: string;
  how_they_come_across?: string;
  expertise_areas?: string[];
  thought_leadership_topics?: string[];
  core_competencies?: string[];
  personal_brand_pillars?: string[];
  key_messaging_themes?: string[];
  strategic_interests?: string[];
  ideal_connections?: string[];
  reciprocity_opportunities?: string[];
  career_trajectory?: string;
  growth_areas?: string[];
  communication_style?: string;
  strategic_positioning?: string;
  market_insights?: string;
  competitive_advantages?: string;
  partnership_opportunities?: string;
}

interface PersonalContextData {
  professional_values?: string[];
  values?: string[] | string;
  motivations?: string[];
  interests?: string[] | string;
  passions?: string[];
  family?: string;
}

export default function ProfileScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { profile, updateProfile, isUpdating } = useUserProfile();
  
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editArrayValues, setEditArrayValues] = useState<Record<string, string[]>>({});
  const [newPersonalInterest, setNewPersonalInterest] = useState('');
  const [newProfessionalInterest, setNewProfessionalInterest] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<{
    howYouComeAcross: string;
    writingStyle: string;
    isAnalyzing: boolean;
  }>({
    howYouComeAcross: '',
    writingStyle: '',
    isAnalyzing: false
  });

  // Trigger fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (field: string, currentValue: string | string[]) => {
    setEditingSection(field);
    if (Array.isArray(currentValue)) {
      setEditArrayValues({ ...editArrayValues, [field]: [...currentValue] });
    } else {
    setEditValues({ ...editValues, [field]: currentValue || '' });
    }
  };

  const handleSave = async (field: string) => {
    try {
      const isArray = field in editArrayValues;
      const value = isArray ? editArrayValues[field] : editValues[field];
      
      // Handle nested field updates (e.g., professional_context.professional_brief)
      const fieldParts = field.split('.');
      if (fieldParts.length > 1) {
        const [contextType, contextField] = fieldParts;
        const currentContext = (profile as any)[contextType] || {};
        const updatedContext = { ...currentContext, [contextField]: value };
        await updateProfile({ [contextType]: updatedContext });
      } else {
        await updateProfile({ [field]: value });
      }
      
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditValues({});
    setEditArrayValues({});
  };

  const handleArrayAdd = (field: string) => {
    const currentArray = editArrayValues[field] || [];
    setEditArrayValues({ ...editArrayValues, [field]: [...currentArray, ''] });
  };

  const handleArrayRemove = (field: string, index: number) => {
    const currentArray = editArrayValues[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setEditArrayValues({ ...editArrayValues, [field]: newArray });
  };

  const handleArrayItemChange = (field: string, index: number, value: string) => {
    const currentArray = editArrayValues[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    setEditArrayValues({ ...editArrayValues, [field]: newArray });
  };

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  const analyzeVoice = async () => {
    setVoiceAnalysis(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      const response = await fetch('/api/user/voice-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_url: profile?.linkedin_url,
          user_id: profile?.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setVoiceAnalysis({
          howYouComeAcross: data.howYouComeAcross || '',
          writingStyle: data.writingStyle || '',
          isAnalyzing: false
        });
      }
    } catch (error) {
      console.error('Voice analysis error:', error);
      setVoiceAnalysis(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  // Helper function to remove duplicates
  const removeDuplicates = (array: string[] | null | undefined): string[] => {
    if (!Array.isArray(array)) {
      return [];
    }
    return Array.from(new Set(array.filter(item => item && item.trim())));
  };

  const renderEditableVoiceField = (field: 'howYouComeAcross' | 'writingStyle', label: string, value: string) => {
    const isEditing = editingSection === field;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            {label}
          </Typography>
        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              value={editValues[field] || ''}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              disabled={isUpdating}
            />
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
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: value ? 'text.primary' : 'text.secondary',
                fontStyle: value ? 'normal' : 'italic',
                flex: 1,
                lineHeight: 1.5
              }}
            >
              {value || `${label} will appear here after analysis`}
          </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleEdit(field, value)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  if (!profile) {
  return (
      <Box sx={{ 
        px: 3,
        pb: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <AutoFixHigh sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Building your enhanced profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Extract professional and personal contexts
  const personalContext = profile.personal_context as PersonalContextData | null;
  const professionalContext = profile.professional_context as ProfessionalContextData | null;
  
  // Handle both string and array formats for interests
  const personalInterestsRaw = personalContext?.interests;
  const personalInterests = removeDuplicates(
    Array.isArray(personalInterestsRaw) 
      ? personalInterestsRaw 
      : personalInterestsRaw 
        ? [personalInterestsRaw] 
        : []
  );
  const professionalInterests = removeDuplicates(professionalContext?.expertise_areas || []);

  return (
    <Box sx={{ 
      px: 3,
      pb: 4
    }}>
      <Fade in={showContent} timeout={800}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
              Here's what we found about you
        </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
              AI offers a good starting point, and you can always edit any section to more accurately reflect how you want to present.
        </Typography>
          </Box>

          {/* Compact Header - matches ContactHeader pattern */}
          <Paper 
            elevation={0} 
            sx={{
              p: { xs: 2, md: 3 }, 
              mb: 3, 
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
              backgroundColor: 'white',
            }}
          >
            <Box sx={{
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              alignItems: { xs: 'flex-start', md: 'center' }, 
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 }, flexGrow: 1 }}>
                <Avatar 
                  src={(profile as any).profile_picture || undefined}
                  sx={{ 
                    width: { xs: 80, md: 96 }, 
                    height: { xs: 80, md: 96 }, 
                    mr: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'Y'}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="h4" component="h1" sx={{ 
                      fontWeight: 'bold', 
                      fontSize: { xs: '1.75rem', md: '2rem' }, 
                      color: '#111827',
                      mr: 1.5 
                    }}>
                      {profile.name || 'Your Name'}
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: '#4b5563', 
                    fontSize: { xs: '0.875rem', md: '1rem' }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 0.5 
                  }}>
                    <Box component="span" sx={{ mr: 0.75, color: 'text.secondary' }}>💼</Box> 
                    {profile.title || 'Senior Manager, Revenue Operations & Strategy'}
          </Typography>
                  <Typography sx={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem', 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <Box component="span" sx={{ mr: 0.75, color: 'text.secondary' }}>📧</Box>
                    {profile.email || 'hfinkelstein@gmail.com'}
          </Typography>
                </Box>
      </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkedIn fontSize="small" sx={{ color: '#0077b5' }} />
                <Chip 
                  label="Connected" 
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Paper>

          {/* Professional Brief */}
          {professionalContext?.professional_brief && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business color="primary" />
                    Professional Brief
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit('professional_context.professional_brief', professionalContext.professional_brief || '')}
                    disabled={editingSection === 'professional_context.professional_brief'}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>
                {editingSection === 'professional_context.professional_brief' ? (
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={editValues['professional_context.professional_brief'] || ''}
                      onChange={(e) => setEditValues({ ...editValues, 'professional_context.professional_brief': e.target.value })}
                      disabled={isUpdating}
                      placeholder="Enter your professional brief..."
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        onClick={() => handleSave('professional_context.professional_brief')}
                        disabled={isUpdating}
                        variant="contained"
                        startIcon={<Save fontSize="small" />}
                      >
                        Save
                      </Button>
                      <Button 
                        size="small" 
                        onClick={handleCancel}
                        disabled={isUpdating}
                        variant="outlined"
                        startIcon={<Cancel fontSize="small" />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                    {professionalContext.professional_brief}
                </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Core Professional Insights */}
          {(professionalContext?.unique_value_proposition || professionalContext?.zone_of_genius || professionalContext?.career_trajectory) && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents color="primary" />
                  Core Professional Insights
                </Typography>
                
                {professionalContext.unique_value_proposition && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Unique Value Proposition:
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.unique_value_proposition', professionalContext.unique_value_proposition || '')}
                        disabled={editingSection === 'professional_context.unique_value_proposition'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.unique_value_proposition' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={editValues['professional_context.unique_value_proposition'] || ''}
                          onChange={(e) => setEditValues({ ...editValues, 'professional_context.unique_value_proposition': e.target.value })}
                          disabled={isUpdating}
                          placeholder="Enter your unique value proposition..."
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.unique_value_proposition')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body1">
                        {professionalContext.unique_value_proposition}
                      </Typography>
                    )}
                  </Box>
                )}
                
                {professionalContext.zone_of_genius && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Zone of Genius:
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.zone_of_genius', professionalContext.zone_of_genius || '')}
                        disabled={editingSection === 'professional_context.zone_of_genius'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.zone_of_genius' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={editValues['professional_context.zone_of_genius'] || ''}
                          onChange={(e) => setEditValues({ ...editValues, 'professional_context.zone_of_genius': e.target.value })}
                          disabled={isUpdating}
                          placeholder="Enter your zone of genius..."
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.zone_of_genius')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body1">
                        {professionalContext.zone_of_genius}
                      </Typography>
                    )}
                  </Box>
                )}
                
                {professionalContext.career_trajectory && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Career Trajectory:
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.career_trajectory', professionalContext.career_trajectory || '')}
                        disabled={editingSection === 'professional_context.career_trajectory'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.career_trajectory' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={editValues['professional_context.career_trajectory'] || ''}
                          onChange={(e) => setEditValues({ ...editValues, 'professional_context.career_trajectory': e.target.value })}
                          disabled={isUpdating}
                          placeholder="Enter your career trajectory..."
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.career_trajectory')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body1">
                        {professionalContext.career_trajectory}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 3 }}>
                  {professionalContext.strategic_interests && professionalContext.strategic_interests.length > 0 && (
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Strategic Interests:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {professionalContext.strategic_interests.map((interest, index) => (
                          <Chip key={index} label={interest} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {professionalContext.ideal_connections && professionalContext.ideal_connections.length > 0 && (
                    <Box sx={{ flex: 1, minWidth: '300px' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Ideal Connections:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {professionalContext.ideal_connections.map((connection, index) => (
                          <Chip key={index} label={connection} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Personal Brand & Communication */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            {/* Personal Brand Pillars */}
            {professionalContext?.personal_brand_pillars && professionalContext.personal_brand_pillars.length > 0 && (
              <Box sx={{ flex: 1, minWidth: '300px' }}>
          <Card>
            <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility color="primary" />
                        Personal Brand Pillars
              </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.personal_brand_pillars', professionalContext.personal_brand_pillars || [])}
                        disabled={editingSection === 'professional_context.personal_brand_pillars'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.personal_brand_pillars' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        {(editArrayValues['professional_context.personal_brand_pillars'] || []).map((pillar, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={pillar}
                              onChange={(e) => handleArrayItemChange('professional_context.personal_brand_pillars', index, e.target.value)}
                              disabled={isUpdating}
                              placeholder="Enter brand pillar..."
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => handleArrayRemove('professional_context.personal_brand_pillars', index)}
                              disabled={isUpdating}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          onClick={() => handleArrayAdd('professional_context.personal_brand_pillars')}
                          disabled={isUpdating}
                          variant="outlined"
                          startIcon={<Add fontSize="small" />}
                        >
                          Add Pillar
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.personal_brand_pillars')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                    variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {professionalContext.personal_brand_pillars.map((pillar, index) => (
                          <Chip key={index} label={pillar} size="small" sx={{ 
                            bgcolor: 'primary.50', 
                            color: 'primary.700',
                            '&:hover': { bgcolor: 'primary.100' }
                          }} />
                        ))}
                      </Box>
                    )}
            </CardContent>
          </Card>
              </Box>
            )}

            {/* Communication Style */}
            {(professionalContext?.writing_voice || professionalContext?.how_they_come_across || professionalContext?.communication_style) && (
              <Box sx={{ flex: 1, minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RecordVoiceOver color="secondary" />
                      Communication Style
                    </Typography>
                    {professionalContext.writing_voice && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Writing Voice:</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit('professional_context.writing_voice', professionalContext.writing_voice || '')}
                            disabled={editingSection === 'professional_context.writing_voice'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingSection === 'professional_context.writing_voice' ? (
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editValues['professional_context.writing_voice'] || ''}
                              onChange={(e) => setEditValues({ ...editValues, 'professional_context.writing_voice': e.target.value })}
                              disabled={isUpdating}
                              placeholder="Enter your writing voice..."
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button 
                                size="small" 
                                onClick={() => handleSave('professional_context.writing_voice')}
                                disabled={isUpdating}
                                variant="contained"
                                startIcon={<Save fontSize="small" />}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={handleCancel}
                                disabled={isUpdating}
                                variant="outlined"
                                startIcon={<Cancel fontSize="small" />}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2">{professionalContext.writing_voice}</Typography>
                        )}
                      </Box>
                    )}
                    {professionalContext.how_they_come_across && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">How You Come Across:</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit('professional_context.how_they_come_across', professionalContext.how_they_come_across || '')}
                            disabled={editingSection === 'professional_context.how_they_come_across'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingSection === 'professional_context.how_they_come_across' ? (
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editValues['professional_context.how_they_come_across'] || ''}
                              onChange={(e) => setEditValues({ ...editValues, 'professional_context.how_they_come_across': e.target.value })}
                              disabled={isUpdating}
                              placeholder="Enter how you come across..."
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button 
                                size="small" 
                                onClick={() => handleSave('professional_context.how_they_come_across')}
                                disabled={isUpdating}
                                variant="contained"
                                startIcon={<Save fontSize="small" />}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={handleCancel}
                                disabled={isUpdating}
                                variant="outlined"
                                startIcon={<Cancel fontSize="small" />}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2">{professionalContext.how_they_come_across}</Typography>
                        )}
                      </Box>
                    )}
                    {professionalContext.communication_style && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Communication Style:</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit('professional_context.communication_style', professionalContext.communication_style || '')}
                            disabled={editingSection === 'professional_context.communication_style'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingSection === 'professional_context.communication_style' ? (
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              value={editValues['professional_context.communication_style'] || ''}
                              onChange={(e) => setEditValues({ ...editValues, 'professional_context.communication_style': e.target.value })}
                              disabled={isUpdating}
                              placeholder="Enter your communication style..."
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button 
                                size="small" 
                                onClick={() => handleSave('professional_context.communication_style')}
                                disabled={isUpdating}
                                variant="contained"
                                startIcon={<Save fontSize="small" />}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={handleCancel}
                                disabled={isUpdating}
                                variant="outlined"
                                startIcon={<Cancel fontSize="small" />}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2">{professionalContext.communication_style}</Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>

          {/* Expertise & Thought Leadership */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            {/* Expertise Areas */}
            {professionalContext?.expertise_areas && professionalContext.expertise_areas.length > 0 && (
              <Box sx={{ flex: 1, minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkOutline color="primary" />
                        Expertise Areas
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.expertise_areas', professionalContext.expertise_areas || [])}
                        disabled={editingSection === 'professional_context.expertise_areas'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.expertise_areas' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        {(editArrayValues['professional_context.expertise_areas'] || []).map((area, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={area}
                              onChange={(e) => handleArrayItemChange('professional_context.expertise_areas', index, e.target.value)}
                              disabled={isUpdating}
                              placeholder="Enter expertise area..."
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => handleArrayRemove('professional_context.expertise_areas', index)}
                              disabled={isUpdating}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          onClick={() => handleArrayAdd('professional_context.expertise_areas')}
                          disabled={isUpdating}
                          variant="outlined"
                          startIcon={<Add fontSize="small" />}
                        >
                          Add Expertise Area
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.expertise_areas')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {professionalContext.expertise_areas.map((area, index) => (
                          <Chip key={index} label={area} size="small" sx={{ 
                            bgcolor: 'primary.50', 
                            color: 'primary.700',
                            '&:hover': { bgcolor: 'primary.100' }
                          }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Thought Leadership Topics */}
            {professionalContext?.thought_leadership_topics && professionalContext.thought_leadership_topics.length > 0 && (
              <Box sx={{ flex: 1, minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiObjects color="secondary" />
                        Thought Leadership Topics
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('professional_context.thought_leadership_topics', professionalContext.thought_leadership_topics || [])}
                        disabled={editingSection === 'professional_context.thought_leadership_topics'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                    {editingSection === 'professional_context.thought_leadership_topics' ? (
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        {(editArrayValues['professional_context.thought_leadership_topics'] || []).map((topic, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={topic}
                              onChange={(e) => handleArrayItemChange('professional_context.thought_leadership_topics', index, e.target.value)}
                              disabled={isUpdating}
                              placeholder="Enter thought leadership topic..."
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => handleArrayRemove('professional_context.thought_leadership_topics', index)}
                              disabled={isUpdating}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          onClick={() => handleArrayAdd('professional_context.thought_leadership_topics')}
                          disabled={isUpdating}
                          variant="outlined"
                          startIcon={<Add fontSize="small" />}
                        >
                          Add Topic
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                          <Button 
                            size="small" 
                            onClick={() => handleSave('professional_context.thought_leadership_topics')}
                            disabled={isUpdating}
                            variant="contained"
                            startIcon={<Save fontSize="small" />}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancel}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Cancel fontSize="small" />}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {professionalContext.thought_leadership_topics.map((topic, index) => (
                          <Chip key={index} label={topic} size="small" sx={{ 
                            bgcolor: 'secondary.50', 
                            color: 'secondary.700',
                            '&:hover': { bgcolor: 'secondary.100' }
                          }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>

          {/* Two-Column Personal Interests (Simplified) */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Personal Interests */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Psychology color="secondary" />
                      Personal Interests
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit('personal_context.interests', personalContext?.interests || [])}
                      disabled={editingSection === 'personal_context.interests'}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Interests & Hobbies
                  </Typography>
                  
                  {editingSection === 'personal_context.interests' ? (
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', mb: 3 }}>
                      {(editArrayValues['personal_context.interests'] || []).map((interest, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={interest}
                            onChange={(e) => handleArrayItemChange('personal_context.interests', index, e.target.value)}
                            disabled={isUpdating}
                            placeholder="Enter interest or hobby..."
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleArrayRemove('personal_context.interests', index)}
                            disabled={isUpdating}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button 
                        size="small" 
                        onClick={() => handleArrayAdd('personal_context.interests')}
                        disabled={isUpdating}
                        variant="outlined"
                        startIcon={<Add fontSize="small" />}
                      >
                        Add Interest
                      </Button>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          size="small" 
                          onClick={() => handleSave('personal_context.interests')}
                          disabled={isUpdating}
                          variant="contained"
                          startIcon={<Save fontSize="small" />}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small" 
                          onClick={handleCancel}
                          disabled={isUpdating}
                          variant="outlined"
                          startIcon={<Cancel fontSize="small" />}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {personalInterests.length > 0 ? (
                        personalInterests.map((interest, index) => (
                          <Chip
                            key={index}
                            label={interest}
                            size="small"
                            sx={{ 
                              bgcolor: 'secondary.50', 
                              color: 'secondary.700',
                              '&:hover': { bgcolor: 'secondary.100' }
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No interests added yet
                        </Typography>
                      )}
                    </Box>
                  )}

                  {personalContext?.values && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                        Core Values
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Array.isArray(personalContext.values) 
                          ? personalContext.values.map((value, index) => (
                              <Chip key={index} label={value} size="small" sx={{ 
                                bgcolor: 'secondary.50', 
                                color: 'secondary.700',
                                '&:hover': { bgcolor: 'secondary.100' }
                              }} />
                            ))
                          : <Chip label={personalContext.values} size="small" sx={{ 
                              bgcolor: 'secondary.50', 
                              color: 'secondary.700',
                              '&:hover': { bgcolor: 'secondary.100' }
                            }} />
                        }
                      </Box>
                    </Box>
                  )}

                  {personalContext?.family && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                        Family & Personal Life
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {personalContext.family}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Goals & Networking */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Flag color="secondary" />
                      Goals & Focus
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit('primary_goal', profile.primary_goal || '')}
                      disabled={editingSection === 'primary_goal'}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
                    Primary Goal
                  </Typography>
                  
                  {editingSection === 'primary_goal' ? (
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', mb: 3 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editValues['primary_goal'] || ''}
                        onChange={(e) => setEditValues({ ...editValues, primary_goal: e.target.value })}
                        disabled={isUpdating}
                        placeholder="Enter your primary goal..."
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button 
                          size="small" 
                          onClick={() => handleSave('primary_goal')}
                          disabled={isUpdating}
                          variant="contained"
                          startIcon={<Save fontSize="small" />}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small" 
                          onClick={handleCancel}
                          disabled={isUpdating}
                          variant="outlined"
                          startIcon={<Cancel fontSize="small" />}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2">{profile.primary_goal || 'Not set'}</Typography>
                    </Box>
                  )}
                  
                  {profile.networking_challenges && profile.networking_challenges.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          Networking Challenges
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit('networking_challenges', profile.networking_challenges || [])}
                          disabled={editingSection === 'networking_challenges'}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {editingSection === 'networking_challenges' ? (
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          {(editArrayValues['networking_challenges'] || []).map((challenge, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={challenge}
                                onChange={(e) => handleArrayItemChange('networking_challenges', index, e.target.value)}
                                disabled={isUpdating}
                                placeholder="Enter networking challenge..."
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => handleArrayRemove('networking_challenges', index)}
                                disabled={isUpdating}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                          <Button 
                            size="small" 
                            onClick={() => handleArrayAdd('networking_challenges')}
                            disabled={isUpdating}
                            variant="outlined"
                            startIcon={<Add fontSize="small" />}
                          >
                            Add Challenge
                          </Button>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                            <Button 
                              size="small" 
                              onClick={() => handleSave('networking_challenges')}
                              disabled={isUpdating}
                              variant="contained"
                              startIcon={<Save fontSize="small" />}
                            >
                              Save
                            </Button>
                            <Button 
                              size="small" 
                              onClick={handleCancel}
                              disabled={isUpdating}
                              variant="outlined"
                              startIcon={<Cancel fontSize="small" />}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {profile.networking_challenges.map((challenge, index) => (
                            <Chip key={index} label={challenge} size="small" sx={{ 
                              bgcolor: 'warning.50', 
                              color: 'warning.700',
                              '&:hover': { bgcolor: 'warning.100' }
                            }} />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Continue Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
              disabled={isNavigating}
              sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
        >
              Continue to Dashboard
        </Button>
          </Box>
      </Box>
      </Fade>
    </Box>
  );
} 