'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Fade,
  Grow,
  Paper,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Celebration as CelebrationIcon,
  ExitToApp as ExitIcon,
  Work as WorkIcon,
  ArrowForward as ArrowForwardIcon,
  FlagOutlined as GoalIcon,
  EmojiEvents as TrophyIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, useCompleteSessionAction } from '@/lib/hooks/useRelationshipSessions';
import { AddContactActionCard } from './AddContactActionCard';
import { AddMeetingNotesActionCard } from './AddMeetingNotesActionCard';
import { format } from 'date-fns';

interface RelationshipSessionInterfaceProps {
  sessionId: string;
  onClose: () => void;
}

export const RelationshipSessionInterface: React.FC<RelationshipSessionInterfaceProps> = ({
  sessionId,
  onClose,
}) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState<boolean>(false);
  const [showInitialCelebration, setShowInitialCelebration] = useState<boolean>(true);
  const queryClient = useQueryClient();
  
  const { data: session, isLoading, error } = useSession(sessionId);
  const completeAction = useCompleteSessionAction();
  
  // Hide initial celebration after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialCelebration(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // Timer logic with pause/resume support
  useEffect(() => {
    if (!session || isPaused) return;
    
    const startTime = new Date(session.timer_started_at || session.started_at);
    const durationMs = (session.duration_minutes || 30) * 60 * 1000;
    const pausedDurationMs = (session.total_paused_duration || 0) * 1000;
    
    const updateTimer = () => {
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime() - pausedDurationMs;
      const remainingMs = Math.max(0, durationMs - elapsedMs);
      
      setTimeRemaining(Math.ceil(remainingMs / 1000));
      
      if (remainingMs <= 0) {
        setIsTimerRunning(false);
      }
    };
    
    updateTimer();
    
    if (isTimerRunning) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [session, isTimerRunning, isPaused]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTimerColor = () => {
    if (timeRemaining <= 0) return 'error';
    if (timeRemaining <= 300) return 'warning'; // 5 minutes
    return 'success';
  };
  
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    setIsTimerRunning(!isPaused);
  };
  
  const completeSession = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/relationship-sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-sessions'] });
      onClose();
    }
  });
  
  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => new Set(prev).add(actionId));
    setRecentlyCompleted(actionId);
    setShowCelebration(true);
    
    // Clear celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setRecentlyCompleted(null);
    }, 3000);
    
    // Check if all actions are completed
    if (session && completedActions.size + 1 >= session.actions.length) {
      setTimeout(() => {
        setShowCompletionDialog(true);
      }, 3500); // Show completion dialog after celebration
    }
  };
  
  const handleActionSkip = (actionId: string) => {
    setCompletedActions(prev => new Set(prev).add(actionId));
    
    // Check if all actions are handled
    if (session && completedActions.size + 1 >= session.actions.length) {
      setTimeout(() => {
        setShowCompletionDialog(true);
      }, 1000);
    }
  };
  
  const handleEndSession = () => {
    completeSession.mutate();
    setShowCompletionDialog(false);
  };
  
  const handleContinueWorking = () => {
    setShowCompletionDialog(false);
    // User can continue working in the session
  };
  
  const renderActionCard = (action: any, index: number) => {
    const isCompleted = completedActions.has(action.id);
    const isRecentlyCompleted = recentlyCompleted === action.id;
    
    if (isCompleted && !isRecentlyCompleted) {
      return null; // Hide completed actions (except recently completed)
    }
    
    return (
      <Fade in={true} timeout={500} key={action.id}>
        <Box sx={{ mb: 3 }}>
          {/* Action Number Indicator */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              label={`Action ${index + 1} of ${session?.actions.length}`}
              size="medium"
              color="primary"
              variant="filled"
              sx={{ 
                fontWeight: 'bold',
                fontSize: '0.9rem',
                px: 2,
                py: 1
              }}
            />
            {isRecentlyCompleted && showCelebration && (
              <Grow in={true} timeout={300}>
                <Chip
                  label="✓ Completed!"
                  size="medium"
                  color="success"
                  sx={{ 
                    bgcolor: 'success.main',
                    color: 'white',
                    fontWeight: 'bold',
                    animation: 'pulse 1s ease-in-out infinite',
                    '& .MuiChip-label': {
                      fontSize: '0.9rem'
                    }
                  }}
                />
              </Grow>
            )}
          </Box>
          
          {/* Enhanced Action Card */}
          <Paper
            elevation={12}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '2px solid',
              borderColor: 'primary.200',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(33, 150, 243, 0.2)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(33, 150, 243, 0.3)',
              }
            }}
          >
            {action.action_type === 'add_contact' ? (
              <AddContactActionCard
                actionId={action.id}
                goalId={action.goal_id}
                goalTitle={goal?.title || 'Unknown Goal'}
                currentCount={currentCount}
                targetCount={targetCount}
                onComplete={handleActionComplete}
                onSkip={handleActionSkip}
              />
            ) : (
              <AddMeetingNotesActionCard
                actionId={action.id}
                meetingArtifactId={action.meeting_artifact_id}
                contactId={action.contact_id}
                contactName={action.contact?.name || 'Unknown Contact'}
                contactProfilePicture={action.contact?.profile_picture || null}
                meetingTitle={action.meeting_artifact?.metadata?.title || 'Meeting'}
                meetingMetadata={action.meeting_artifact?.metadata || {}}
                onComplete={handleActionComplete}
                onSkip={handleActionSkip}
              />
            )}
          </Paper>
        </Box>
      </Fade>
    );
  };
  
  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <RocketIcon sx={{ fontSize: 64, mb: 2, animation: 'pulse 2s ease-in-out infinite' }} />
          <Typography variant="h6">Loading your relationship building session...</Typography>
        </Box>
      </Box>
    );
  }
  
  if (error || !session) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 4
      }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Session Loading Error</Typography>
          Failed to load relationship session. Please try again.
          <Box sx={{ mt: 2 }}>
            <Button onClick={onClose} variant="contained">
              Return to Dashboard
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }
  
  const totalActions = session.actions.length;
  const completedCount = completedActions.size;
  const progress = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;
  const remainingActions = session.actions.filter((action: any) => !completedActions.has(action.id));
  const allActionsCompleted = completedCount === totalActions;
  
  // Get goal information from session or first action
  const goal = session.goal || session.actions[0]?.goal;
  
  // Calculate current and target counts for the goal
  const currentCount = goal?.goal_contacts?.length || 0;
  const targetCount = goal?.target_contact_count || 50;
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      {/* Initial Celebration Overlay */}
      {showInitialCelebration && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Fade in={showInitialCelebration} timeout={1000}>
            <Box
              sx={{
                textAlign: 'center',
                color: 'white',
                padding: 4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
              }}
            >
              <TrophyIcon sx={{ fontSize: 80, mb: 2, color: '#FFD700' }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                🎉 Relationship Building Time! 🎉
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 500, mx: 'auto' }}>
                Time to strengthen your professional network and advance your goal. 
                Let's build meaningful connections that matter!
              </Typography>
            </Box>
          </Fade>
        </Box>
      )}

      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Main Content */}
      <Box sx={{ p: 4, pt: 8, maxWidth: 1000, mx: 'auto' }}>
        {/* Goal Display Card */}
        {goal && (
          <Card
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              borderRadius: 3,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <GoalIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Current Goal
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', lineHeight: 1.4 }}>
                {goal.title}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Session Status Card */}
        <Card
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            borderRadius: 3,
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Timer Section */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <AccessTimeIcon sx={{ fontSize: 32, color: getTimerColor() === 'success' ? 'success.main' : getTimerColor() === 'warning' ? 'warning.main' : 'error.main' }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: getTimerColor() === 'success' ? 'success.main' : getTimerColor() === 'warning' ? 'warning.main' : 'error.main',
                    animation: timeRemaining <= 60 ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  {formatTime(timeRemaining)}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handlePauseResume}
                  startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  sx={{ ml: 2 }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </Box>
            </Box>

            {/* Progress Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Session Progress
                </Typography>
                <Chip
                  label={`${completedCount} of ${totalActions} actions`}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
                  },
                }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {progress.toFixed(0)}% Complete
              </Typography>
            </Box>

            {showCelebration && (
              <Grow in={true} timeout={500}>
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 3, 
                    bgcolor: 'success.50',
                    border: '2px solid',
                    borderColor: 'success.main',
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      fontSize: '2rem'
                    }
                  }}
                  icon={<CelebrationIcon />}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🎉 Outstanding! Action completed successfully!
                  </Typography>
                  <Typography variant="body1">
                    {remainingActions.length > 0 
                      ? `${remainingActions.length} more action${remainingActions.length > 1 ? 's' : ''} to go. You're building momentum!`
                      : 'All actions completed! You\'re crushing it!'
                    }
                  </Typography>
                </Alert>
              </Grow>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <Box>
          {remainingActions.length > 0 ? (
            // Show only the current action (first remaining action)
            (() => {
              const currentAction = remainingActions[0];
              const currentActionIndex = totalActions - remainingActions.length + 1;
              
              return (
                <Fade in={true} timeout={500} key={currentAction.id}>
                  <Box sx={{ mb: 3 }}>
                    {/* Action Number Indicator */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Chip
                        label={`Action ${currentActionIndex} of ${totalActions}`}
                        size="medium"
                        color="primary"
                        variant="filled"
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          px: 2,
                          py: 1
                        }}
                      />
                      {recentlyCompleted === currentAction.id && showCelebration && (
                        <Grow in={true} timeout={300}>
                          <Chip
                            label="✓ Completed!"
                            size="medium"
                            color="success"
                            sx={{ 
                              bgcolor: 'success.main',
                              color: 'white',
                              fontWeight: 'bold',
                              animation: 'pulse 1s ease-in-out infinite',
                              '& .MuiChip-label': {
                                fontSize: '0.9rem'
                              }
                            }}
                          />
                        </Grow>
                      )}
                    </Box>
                    
                    {/* Enhanced Action Card */}
                    <Paper
                      elevation={12}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '2px solid',
                        borderColor: 'primary.200',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(33, 150, 243, 0.2)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(33, 150, 243, 0.3)',
                        }
                      }}
                    >
                      {currentAction.action_type === 'add_contact' ? (
                        <AddContactActionCard
                          actionId={currentAction.id}
                          goalId={currentAction.goal_id}
                          goalTitle={goal?.title || 'Unknown Goal'}
                          currentCount={currentCount}
                          targetCount={targetCount}
                          onComplete={handleActionComplete}
                          onSkip={handleActionSkip}
                        />
                      ) : (
                        <AddMeetingNotesActionCard
                          actionId={currentAction.id}
                          meetingArtifactId={currentAction.meeting_artifact_id}
                          contactId={currentAction.contact_id}
                          contactName={currentAction.contact?.name || 'Unknown Contact'}
                          contactProfilePicture={currentAction.contact?.profile_picture || null}
                          meetingTitle={currentAction.meeting_artifact?.metadata?.title || 'Meeting'}
                          meetingMetadata={currentAction.meeting_artifact?.metadata || {}}
                          onComplete={handleActionComplete}
                          onSkip={handleActionSkip}
                        />
                      )}
                    </Paper>
                  </Box>
                </Fade>
              );
            })()
          ) : (
            !showCompletionDialog && (
              <Card sx={{ 
                bgcolor: 'success.50', 
                border: '3px solid', 
                borderColor: 'success.main',
                borderRadius: 3,
                boxShadow: '0 16px 48px rgba(76, 175, 80, 0.3)'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <CelebrationIcon color="success" sx={{ fontSize: 80, mb: 3 }} />
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    🎉 Incredible Work!
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    You've successfully completed all relationship building actions in this session. 
                    This is how meaningful connections are built!
                  </Typography>
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setShowCompletionDialog(true)}
                      startIcon={<ArrowForwardIcon />}
                      sx={{ px: 4, py: 1.5 }}
                    >
                      What's Next?
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          )}
        </Box>
      </Box>
      
      {/* Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <CelebrationIcon color="success" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {allActionsCompleted ? 'Session Complete!' : 'End Session?'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {allActionsCompleted ? (
              <>
                <Typography variant="h6" gutterBottom>
                  🎉 Congratulations! You've completed all {totalActions} relationship building actions.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  You can continue working in this session or end it now.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  You've completed {completedCount} of {totalActions} actions.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Would you like to continue working or end the session?
                </Typography>
              </>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="outlined"
                onClick={handleContinueWorking}
                startIcon={<WorkIcon />}
                fullWidth
                size="large"
                sx={{ py: 2 }}
              >
                Continue Working
                <Typography variant="body2" sx={{ ml: 1, opacity: 0.7 }}>
                  (Keep session open for more relationship building)
                </Typography>
              </Button>
              
              <Button
                variant="contained"
                onClick={handleEndSession}
                startIcon={<ExitIcon />}
                fullWidth
                size="large"
                sx={{ py: 2 }}
                disabled={completeSession.isPending}
              >
                {completeSession.isPending ? 'Ending Session...' : 'End Session'}
                <Typography variant="body2" sx={{ ml: 1, opacity: 0.7 }}>
                  (Close and save progress)
                </Typography>
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 