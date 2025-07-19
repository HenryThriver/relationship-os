'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  FlagOutlined as GoalIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useGoalsForRelationshipBuilding, useGoalSessionActions, useCreateSession } from '@/lib/hooks/useRelationshipSessions';
import { useTouchFriendlySize, useIsMobile } from '@/lib/hooks/useMobile';
import { responsive } from '@/lib/utils/mobileDesign';

interface SessionStartModalProps {
  open: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
}

export const SessionStartModal: React.FC<SessionStartModalProps> = ({
  open,
  onClose,
  onSessionCreated,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  
  const { data: goals, isLoading: loadingGoals, error: goalsError } = useGoalsForRelationshipBuilding();
  const { data: actions, isLoading: loadingActions } = useGoalSessionActions(selectedGoalId);
  const createSession = useCreateSession();
  const touchFriendly = useTouchFriendlySize();
  const isMobile = useIsMobile();
  
  const durationOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 25, label: '25 minutes' },
    { value: 50, label: '50 minutes' },
    { value: 'custom', label: 'Custom' },
  ];
  
  const handleGoalChange = (goalId: string) => {
    setSelectedGoalId(goalId);
  };

  const handleDurationChange = (value: number | string) => {
    if (value === 'custom') {
      setIsCustomDuration(true);
      setSelectedDuration(30); // Default fallback
    } else {
      setIsCustomDuration(false);
      setSelectedDuration(value as number);
    }
  };

  const handleCustomDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomDuration(value);
    
    // Parse and set the duration
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setSelectedDuration(numericValue);
    }
  };

  const getEffectiveDuration = () => {
    if (isCustomDuration) {
      const customValue = parseInt(customDuration, 10);
      return !isNaN(customValue) && customValue > 0 ? customValue : 30;
    }
    return selectedDuration;
  };
  
  const handleStartSession = async () => {
    if (!selectedGoalId || !actions || actions.length === 0) return;
    
    const actionsToCreate = (actions as { type: string; goal_id: string; meeting_artifact_id?: string; contact_id: string }[]).map((action: { type: string; goal_id: string; meeting_artifact_id?: string; contact_id: string }) => ({
      type: action.type as 'add_contact' | 'add_meeting_notes',
      goal_id: action.goal_id,
      meeting_artifact_id: action.meeting_artifact_id,
      contact_id: action.contact_id,
    }));
    
    try {
      const session = await createSession.mutateAsync({
        goalId: selectedGoalId,
        durationMinutes: getEffectiveDuration(),
        actions: actionsToCreate
      });
      onSessionCreated((session as { id: string }).id || '');
      onClose();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };
  
  const renderGoalOption = (goal: unknown) => {
    const typedGoal = goal as { id: string; title: string; description?: string | null };
    return (
      <Card
        key={typedGoal.id}
        variant={selectedGoalId === typedGoal.id ? "outlined" : "elevation"}
        sx={{
          cursor: 'pointer',
          border: selectedGoalId === typedGoal.id ? 2 : 1,
          borderColor: selectedGoalId === typedGoal.id ? 'primary.main' : 'divider',
          backgroundColor: selectedGoalId === typedGoal.id ? 'primary.50' : 'background.paper',
          '&:hover': {
            backgroundColor: selectedGoalId === typedGoal.id ? 'primary.100' : 'grey.50'
          }
        }}
        onClick={() => handleGoalChange(typedGoal.id)}
      >
        <CardContent sx={{ p: responsive(1.5, 2) }}>
          <Box display="flex" alignItems="center" gap={responsive(1, 2)}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <GoalIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {typedGoal.title}
              </Typography>
              <Stack 
                direction={isMobile ? 'column' : 'row'} 
                spacing={1} 
                alignItems={isMobile ? 'flex-start' : 'center'}
              >
                <Chip 
                  label={`${(typedGoal as { current_contact_count?: number }).current_contact_count || 0}/${(typedGoal as { target_contact_count?: number }).target_contact_count || 50} contacts`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`${(typedGoal as { total_opportunities?: number }).total_opportunities || 0} action${((typedGoal as { total_opportunities?: number }).total_opportunities || 0) > 1 ? 's' : ''}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  const hasGoals = goals && goals.length > 0;
  const canStartSession = selectedGoalId && actions && actions.length > 0 && !createSession.isPending;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isMobile ? false : 'sm'}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 2,
          maxWidth: isMobile ? '100vw' : undefined,
          maxHeight: isMobile ? '100vh' : undefined,
          margin: isMobile ? 0 : undefined
        }
      }}
    >
      <DialogTitle sx={{ p: responsive(2, 3) }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography 
            variant="h6"
            sx={{ fontSize: responsive('1.125rem', '1.25rem') }}
          >
            Start Relationship Building Session
          </Typography>
          <IconButton 
            onClick={onClose} 
            size={isMobile ? 'medium' : 'small'}
            sx={{ minHeight: touchFriendly.minTouchTarget }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: responsive(2, 3) }}>
        {loadingGoals && (
          <Box sx={{ py: 4 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Finding goals needing relationship building...
            </Typography>
          </Box>
        )}
        
        {goalsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load goals. Please try again.
          </Alert>
        )}
        
        {hasGoals && (
          <>
            {/* Duration Selection */}
            <Box sx={{ mb: responsive(2, 3) }}>
              <Typography variant="subtitle1" gutterBottom>
                Session Duration
              </Typography>
              <Box 
                display="grid" 
                gridTemplateColumns={isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))'}
                gap={1}
              >
                {durationOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={
                      (option.value === 'custom' && isCustomDuration) || 
                      (option.value !== 'custom' && !isCustomDuration && selectedDuration === option.value)
                        ? "contained" 
                        : "outlined"
                    }
                    size={touchFriendly.buttonSize as 'small' | 'medium'}
                    onClick={() => handleDurationChange(option.value)}
                    startIcon={option.value === 'custom' ? <TimerIcon /> : undefined}
                    sx={{ minHeight: touchFriendly.minTouchTarget }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Box>
              
              {/* Custom Duration Input */}
              {isCustomDuration && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Duration"
                    value={customDuration}
                    onChange={handleCustomDurationChange}
                    type="number"
                    size={isMobile ? 'medium' : 'small'}
                    fullWidth={isMobile}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                    }}
                    inputProps={{
                      min: 1,
                      max: 480, // 8 hours max
                    }}
                    helperText="How long would you like?"
                    error={customDuration !== '' && (isNaN(parseInt(customDuration, 10)) || parseInt(customDuration, 10) <= 0)}
                    sx={{ 
                      width: isMobile ? '100%' : 200,
                      maxWidth: isMobile ? undefined : 200
                    }}
                  />
                </Box>
              )}
            </Box>
            
            {/* Goal Selection */}
            <Box sx={{ mb: responsive(2, 3) }}>
              <Typography variant="subtitle1" gutterBottom>
                Choose Goal ({goals?.length || 0} available)
              </Typography>
              <Stack spacing={responsive(1, 2)}>
                {goals?.map(renderGoalOption)}
              </Stack>
            </Box>
            
            {loadingActions && selectedGoalId && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading actions for selected goal...
                </Typography>
              </Box>
            )}
          </>
        )}
        
        {!loadingGoals && !hasGoals && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              All caught up!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No goals need relationship building at the moment.
            </Typography>
          </Box>
        )}
        
        {createSession.isPending && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Creating your relationship building session...
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: responsive(2, 3),
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          size={touchFriendly.buttonSize as 'medium' | 'large'}
          fullWidth={isMobile}
          sx={{ 
            minHeight: touchFriendly.minTouchTarget,
            order: isMobile ? 2 : 1
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartSession}
          variant="contained"
          disabled={!canStartSession}
          startIcon={<PlayArrowIcon />}
          size={touchFriendly.buttonSize as 'medium' | 'large'}
          fullWidth={isMobile}
          sx={{ 
            minHeight: touchFriendly.minTouchTarget,
            order: isMobile ? 1 : 2
          }}
        >
          Start {getEffectiveDuration()}min Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 