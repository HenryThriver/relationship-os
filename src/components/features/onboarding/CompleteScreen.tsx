'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Divider,
  LinearProgress,
  Fade
} from '@mui/material';
import { 
  CheckCircle, 
  Celebration,
  LinkedIn,
  RecordVoiceOver,
  Person,
  TrendingUp,
  Handshake,
  ArrowForward,
  Dashboard
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useRouter } from 'next/navigation';

export default function CompleteScreen() {
  const { completeOnboarding, isCompleting } = useOnboardingState();
  const { profile, profileCompletion } = useUserProfile();
  const router = useRouter();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementIndex, setAchievementIndex] = useState(0);

  // Celebration animation
  useEffect(() => {
    setShowCelebration(true);
    
    // Cycle through achievements
    const achievements = getAchievements();
    if (achievements.length > 1) {
      const interval = setInterval(() => {
        setAchievementIndex(prev => (prev + 1) % achievements.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [profile]);

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      router.push('/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      // Still redirect on error
      router.push('/dashboard');
    }
  };

  const getAchievements = () => {
    if (!profile) return [];
    
    const achievements = [];
    
    if (profile.networking_challenges?.length > 0) {
      achievements.push({
        icon: <RecordVoiceOver color="primary" />,
        title: 'Voice Insights Captured',
        description: `Identified ${profile.networking_challenges.length} networking challenges`,
        color: 'primary'
      });
    }
    
    if (profile.linkedin_analysis_completed_at) {
      achievements.push({
        icon: <LinkedIn color="primary" />,
        title: 'LinkedIn Profile Analyzed',
        description: 'Professional insights extracted and applied',
        color: 'info'
      });
    }
    
    if (profile.primary_goal) {
      achievements.push({
        icon: <TrendingUp color="primary" />,
        title: 'Goals Defined',
        description: 'Clear networking objectives set',
        color: 'success'
      });
    }
    
    if (profile.ways_to_help_others?.length > 0) {
      achievements.push({
        icon: <Handshake color="primary" />,
        title: 'Value Proposition Created',
        description: `${profile.ways_to_help_others.length} ways to help others identified`,
        color: 'secondary'
      });
    }
    
    return achievements;
  };

  const getNextSteps = () => {
    const steps = [];
    
    if (!profile?.linkedin_analysis_completed_at) {
      steps.push({
        title: 'Connect Your LinkedIn',
        description: 'Get AI-powered insights from your professional profile',
        action: 'Add LinkedIn Profile',
        urgent: true
      });
    }
    
    if (!profile?.networking_challenges?.length) {
      steps.push({
        title: 'Record Networking Challenges',
        description: 'Share your networking goals via voice memo for personalized guidance',
        action: 'Record Voice Memo',
        urgent: true
      });
    }
    
    steps.push({
      title: 'Import Your Contacts',
      description: 'Connect Gmail and LinkedIn to start building your network',
      action: 'Import Contacts',
      urgent: false
    });
    
    steps.push({
      title: 'Set Up Integrations',
      description: 'Connect calendar and email for automated relationship tracking',
      action: 'Configure Integrations',
      urgent: false
    });
    
    return steps;
  };

  const achievements = getAchievements();
  const nextSteps = getNextSteps();
  const currentAchievement = achievements[achievementIndex];

  if (!profile || !profileCompletion) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Preparing your celebration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Celebration Header */}
      <Fade in={showCelebration} timeout={1000}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            🎉 Congratulations!
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Your Connection OS profile is ready
          </Typography>
          
          {/* Profile Completion Status */}
          <Alert 
            severity="success" 
            icon={<Celebration />}
            sx={{ mb: 4, textAlign: 'left', maxWidth: 500, mx: 'auto' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Profile {profileCompletion.completion_percentage}% Complete
            </Typography>
            <Typography variant="body2">
              You're ready to start building meaningful professional relationships!
            </Typography>
          </Alert>
        </Box>
      </Fade>

      <Stack spacing={3}>
        {/* Achievements & Profile Summary Row */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Achievements */}
          {achievements.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Celebration color="primary" />
                    Your Achievements
                  </Typography>
                  
                  {currentAchievement && (
                    <Fade in={true} key={achievementIndex}>
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ mb: 2 }}>
                          {currentAchievement.icon}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {currentAchievement.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentAchievement.description}
                        </Typography>
                      </Box>
                    </Fade>
                  )}
                  
                  {achievements.length > 1 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {achievementIndex + 1} of {achievements.length} achievements
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Profile Summary */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  Profile Summary
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Professional Identity
                    </Typography>
                    <Typography variant="body1">
                      {profile.name} {profile.title && `• ${profile.title}`}
                    </Typography>
                    {profile.company && (
                      <Typography variant="body2" color="text.secondary">
                        {profile.company}
                      </Typography>
                    )}
                  </Box>
                  
                  {profile.primary_goal && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Primary Goal
                      </Typography>
                      <Typography variant="body1">
                        {profile.primary_goal}
                      </Typography>
                    </Box>
                  )}
                  
                  {profile.ways_to_help_others?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Value You Bring
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {profile.ways_to_help_others.slice(0, 3).map((way, index) => (
                          <Chip 
                            key={index}
                            label={way}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Next Steps */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowForward color="primary" />
              What's Next?
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
              {nextSteps.map((step, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                    p: 2, 
                    border: 1, 
                    borderColor: step.urgent ? 'warning.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: step.urgent ? 'warning.50' : 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {step.title}
                    </Typography>
                    {step.urgent && (
                      <Chip label="Recommended" size="small" color="warning" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  <Button 
                    size="small" 
                    variant={step.urgent ? 'contained' : 'outlined'}
                    color={step.urgent ? 'warning' : 'primary'}
                  >
                    {step.action}
                  </Button>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <Divider sx={{ my: 4 }} />

      {/* Main Action */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleComplete}
          disabled={isCompleting}
          startIcon={<Dashboard />}
          sx={{ 
            px: 8, 
            py: 3, 
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: 3,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          }}
        >
          {isCompleting ? 'Finishing Setup...' : 'Enter Connection OS'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Welcome to your personalized networking assistant
        </Typography>
      </Box>
    </Box>
  );
} 