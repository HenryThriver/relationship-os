'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress, 
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  Fade
} from '@mui/material';
import { 
  AutoFixHigh, 
  CheckCircle, 
  Psychology,
  LinkedIn,
  RecordVoiceOver,
  Person
} from '@mui/icons-material';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'skipped';
  description: string;
  insights?: string[];
}

export default function ProcessingScreen() {
  const { nextScreen, completeScreen, currentScreen, isNavigating } = useOnboardingState();
  const { profile, profileCompletion } = useUserProfile();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'voice_analysis',
      label: 'Analyzing Voice Memos',
      icon: <RecordVoiceOver />,
      status: 'pending',
      description: 'Processing your networking challenges and goals...',
      insights: []
    },
    {
      id: 'linkedin_analysis',
      label: 'LinkedIn Profile Analysis',
      icon: <LinkedIn />,
      status: 'pending',
      description: 'Extracting professional insights and opportunities...',
      insights: []
    },
    {
      id: 'profile_synthesis',
      label: 'Profile Synthesis',
      icon: <Psychology />,
      status: 'pending',
      description: 'Creating personalized recommendations...',
      insights: []
    },
    {
      id: 'completion',
      label: 'Profile Ready',
      icon: <Person />,
      status: 'pending',
      description: 'Your personalized networking profile is ready!',
      insights: []
    }
  ]);

  useEffect(() => {
    if (!profile) return;

    // Simulate processing steps based on actual profile data
    const processSteps = async () => {
      // Step 1: Voice Analysis
      setCurrentStepIndex(0);
      setSteps(prev => prev.map((step, idx) => 
        idx === 0 ? { ...step, status: 'processing' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 2000));

             const voiceInsights: string[] = [];
       if (profile.networking_challenges?.length > 0) {
         voiceInsights.push(`Identified ${profile.networking_challenges.length} key networking challenges`);
         voiceInsights.push('Personalized conversation starters generated');
       }
       if (profile.primary_goal) {
         voiceInsights.push('Professional goals clarified and prioritized');
       }

      setSteps(prev => prev.map((step, idx) => 
        idx === 0 ? { 
          ...step, 
          status: profile.networking_challenges?.length > 0 || profile.primary_goal ? 'completed' : 'skipped',
          insights: voiceInsights
        } : step
      ));

      // Step 2: LinkedIn Analysis
      setCurrentStepIndex(1);
      setSteps(prev => prev.map((step, idx) => 
        idx === 1 ? { ...step, status: 'processing' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 2500));

             const linkedinInsights: string[] = [];
       if (profile.linkedin_analysis_completed_at) {
         if (profile.ways_to_help_others?.length > 0) {
           linkedinInsights.push(`Found ${profile.ways_to_help_others.length} ways you can help others`);
         }
         if (profile.introduction_opportunities?.length > 0) {
           linkedinInsights.push(`Identified ${profile.introduction_opportunities.length} introduction opportunities`);
         }
         if (profile.knowledge_to_share?.length > 0) {
           linkedinInsights.push(`Extracted ${profile.knowledge_to_share.length} areas of expertise to share`);
         }
         linkedinInsights.push('Professional communication style analyzed');
       }

      setSteps(prev => prev.map((step, idx) => 
        idx === 1 ? { 
          ...step, 
          status: profile.linkedin_analysis_completed_at ? 'completed' : 'skipped',
          insights: linkedinInsights
        } : step
      ));

      // Step 3: Profile Synthesis
      setCurrentStepIndex(2);
      setSteps(prev => prev.map((step, idx) => 
        idx === 2 ? { ...step, status: 'processing' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 1500));

             const synthesisInsights: string[] = [];
       if (profileCompletion) {
         synthesisInsights.push(`Profile ${profileCompletion.completion_percentage}% complete`);
         if (profileCompletion.completion_percentage >= 70) {
           synthesisInsights.push('Ready for advanced networking features');
         }
         if (profileCompletion.suggestions.length > 0) {
           synthesisInsights.push(`${profileCompletion.suggestions.length} improvement suggestions generated`);
         }
       }
       synthesisInsights.push('Personalized networking strategy created');

      setSteps(prev => prev.map((step, idx) => 
        idx === 2 ? { 
          ...step, 
          status: 'completed',
          insights: synthesisInsights
        } : step
      ));

      // Step 4: Completion
      setCurrentStepIndex(3);
      setSteps(prev => prev.map((step, idx) => 
        idx === 3 ? { ...step, status: 'processing' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));

      const completionInsights = [
        'Your networking profile is ready to use',
        'Personalized recommendations available',
        'Ready to connect with your network'
      ];

      setSteps(prev => prev.map((step, idx) => 
        idx === 3 ? { 
          ...step, 
          status: 'completed',
          insights: completionInsights
        } : step
      ));

      // Collect all insights
      const allInsights = [
        ...voiceInsights,
        ...linkedinInsights,
        ...synthesisInsights,
        ...completionInsights
      ];
      setInsights(allInsights);
      setProcessingComplete(true);
    };

    processSteps();
  }, [profile, profileCompletion]);

  const handleContinue = async () => {
    await completeScreen(currentScreen);
    await nextScreen();
  };

  const getStepIcon = (step: ProcessingStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle color="success" />;
    } else if (step.status === 'processing') {
      return <CircularProgress size={24} />;
    } else if (step.status === 'skipped') {
      return <Box sx={{ color: 'text.disabled' }}>{step.icon}</Box>;
    } else {
      return step.icon;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <AutoFixHigh color="primary" sx={{ fontSize: 48 }} />
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Processing Your Profile
      </Typography>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        We're analyzing your information to create personalized recommendations.
      </Typography>

      {/* Progress Bar */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Processing Steps
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedSteps}/{totalSteps} Complete
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Processing Steps */}
      <Box sx={{ mb: 4, textAlign: 'left' }}>
        <Stepper orientation="vertical" activeStep={currentStepIndex}>
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.status === 'completed'}>
              <StepLabel 
                icon={getStepIcon(step, index)}
                optional={
                  step.status === 'skipped' ? (
                    <Typography variant="caption" color="text.secondary">
                      Skipped
                    </Typography>
                  ) : null
                }
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {step.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                
                {/* Show insights for completed steps */}
                {step.status === 'completed' && step.insights && step.insights.length > 0 && (
                  <Fade in={true}>
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {step.insights.map((insight, idx) => (
                          <Chip 
                            key={idx}
                            label={insight}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Fade>
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Completion Status */}
      {processingComplete && (
        <Fade in={true}>
          <Alert 
            severity="success" 
            icon={<CheckCircle />}
            sx={{ mb: 4, textAlign: 'left' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Processing Complete!
            </Typography>
            <Typography variant="body2">
              Your personalized networking profile has been created with {insights.length} insights and recommendations.
            </Typography>
          </Alert>
        </Fade>
      )}
      
      <Button
        variant="contained"
        size="large"
        onClick={handleContinue}
        disabled={isNavigating || !processingComplete}
        sx={{ px: 6, py: 2 }}
      >
        {processingComplete ? 'View Your Profile' : 'Processing...'}
      </Button>
    </Box>
  );
} 