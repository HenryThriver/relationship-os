'use client';

import React from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, LinearProgress, Button } from '@mui/material';
import { Person, Psychology, Handshake, Flag } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';

export default function UserProfilePage() {
  const router = useRouter();
  const { profile, isLoading, profileCompletion } = useUserProfile();
  const { state: onboardingState, isComplete: onboardingComplete } = useOnboardingState();

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Typography>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Connection OS!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Let's get started by setting up your profile
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/onboarding')}
            sx={{ px: 6, py: 2 }}
          >
            Start Onboarding
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person />
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your professional profile and networking goals
        </Typography>
      </Box>

      {/* Profile Completion */}
      {profileCompletion && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Completion
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={profileCompletion.completion_percentage} 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {profileCompletion.completion_percentage}%
              </Typography>
            </Box>
            {profileCompletion.suggestions.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Suggestions to improve your profile:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileCompletion.suggestions.map((suggestion, index) => (
                    <Chip key={index} label={suggestion} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Basic Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" />
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{profile.name || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{profile.email || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Company</Typography>
                <Typography variant="body1">{profile.company || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Title</Typography>
                <Typography variant="body1">{profile.title || 'Not set'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Flag fontSize="small" />
              Goals
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Primary Goal</Typography>
                <Typography variant="body1">{profile.primary_goal || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{profile.goal_description || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Timeline</Typography>
                <Typography variant="body1">{profile.goal_timeline || 'Not set'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Networking Challenges */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology fontSize="small" />
              Networking Challenges
            </Typography>
            {profile.networking_challenges && profile.networking_challenges.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.networking_challenges.map((challenge, index) => (
                  <Chip key={index} label={challenge} size="small" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No challenges recorded yet
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Ways to Help Others */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Handshake fontSize="small" />
              Ways to Help Others
            </Typography>
            {profile.ways_to_help_others && profile.ways_to_help_others.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.ways_to_help_others.map((way, index) => (
                  <Chip key={index} label={way} size="small" color="primary" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No ways to help recorded yet
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Onboarding Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">
                Status: {onboardingComplete ? 'Complete' : 'In Progress'}
              </Typography>
              {onboardingState && (
                <Typography variant="body2" color="text.secondary">
                  Current Screen: {onboardingState.current_screen || 1}
                </Typography>
              )}
            </Box>
            {!onboardingComplete && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => router.push('/onboarding')}
                >
                  Continue Onboarding
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 