'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { Flag, TrendingUp } from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import type { GoalData } from '@/types/userProfile';

const GOAL_TIMELINES = [
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '2+ years', label: '2+ years' }
];

const GOAL_SUGGESTIONS = [
  'Find a new job or career opportunity',
  'Build industry connections and thought leadership',
  'Expand my professional network in a new city',
  'Connect with potential mentors or advisors',
  'Find co-founders or business partners',
  'Build relationships with potential clients',
  'Develop strategic partnerships for my business',
  'Connect with investors or funding sources',
  'Build a personal brand and online presence',
  'Transition to a new industry or role'
];

export default function GoalsScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { setGoal, isSettingGoal } = useUserProfile();
  
  const [goalData, setGoalData] = useState<GoalData>({
    primary_goal: '',
    description: '',
    timeline: '',
    success_criteria: ''
  });
  const [error, setError] = useState<string>('');

  const handleGoalSuggestionClick = (suggestion: string) => {
    setGoalData(prev => ({ ...prev, primary_goal: suggestion }));
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!goalData.primary_goal.trim()) {
      setError('Please enter your primary networking goal');
      return;
    }
    
    if (!goalData.description.trim()) {
      setError('Please describe your goal in more detail');
      return;
    }
    
    if (!goalData.timeline) {
      setError('Please select a timeline for your goal');
      return;
    }

    setError('');

    try {
      // Save the goal data
      await setGoal(goalData);
      
      // Mark this screen as complete
      await completeScreen(currentScreen);
      
      // Move to next screen
      await nextScreen();
    } catch (err) {
      console.error('Error saving goal:', err);
      setError('Failed to save your goal. Please try again.');
    }
  };

  const isLoading = isNavigating || isSettingGoal;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Flag color="primary" sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          What's Your Networking Goal?
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Let's define what you want to achieve through networking
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Goal Suggestions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp fontSize="small" />
            Popular Goals
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click on any goal that resonates with you, or write your own below
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {GOAL_SUGGESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant={goalData.primary_goal === suggestion ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleGoalSuggestionClick(suggestion)}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              >
                {suggestion}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Goal Input Form */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Primary Goal */}
        <TextField
          label="Your Primary Networking Goal"
          placeholder="e.g., Find a new job in the tech industry"
          value={goalData.primary_goal}
          onChange={(e) => setGoalData(prev => ({ ...prev, primary_goal: e.target.value }))}
          multiline
          rows={2}
          fullWidth
          required
        />

        {/* Goal Description */}
        <TextField
          label="Describe Your Goal in More Detail"
          placeholder="What specifically are you looking for? What would success look like?"
          value={goalData.description}
          onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
          multiline
          rows={3}
          fullWidth
          required
          helperText="The more specific you are, the better we can help you achieve your goal"
        />

        {/* Timeline */}
        <FormControl fullWidth required>
          <InputLabel>Timeline</InputLabel>
          <Select
            value={goalData.timeline}
            label="Timeline"
            onChange={(e) => setGoalData(prev => ({ ...prev, timeline: e.target.value }))}
          >
            {GOAL_TIMELINES.map((timeline) => (
              <MenuItem key={timeline.value} value={timeline.value}>
                {timeline.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Success Criteria */}
        <TextField
          label="How Will You Know You've Succeeded? (Optional)"
          placeholder="e.g., Land 3 interviews, Make 10 new industry connections, Close 2 partnership deals"
          value={goalData.success_criteria}
          onChange={(e) => setGoalData(prev => ({ ...prev, success_criteria: e.target.value }))}
          multiline
          rows={2}
          fullWidth
          helperText="Specific success metrics help track your progress"
        />
      </Box>

      {/* Continue Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
          disabled={isLoading}
          sx={{ 
            px: 6, 
            py: 2, 
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 3
          }}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </Box>
    </Box>
  );
} 