import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  SelectChangeEvent,
  Chip,
  Grid,
  Paper,
  Rating
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { LoopArtifact, LoopStatus, LoopType, LoopAction, LoopArtifactContent } from '@/types/artifact';
import { useLoops } from '@/lib/hooks/useLoops';
import { LoopStatusBadge } from '@/components/ui/LoopStatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

interface LoopDetailModalProps {
  open: boolean;
  onClose: () => void;
  loop: LoopArtifact | null;
  contactName: string;
}

export const LoopDetailModal: React.FC<LoopDetailModalProps> = ({
  open,
  onClose,
  loop,
  contactName,
}) => {
  const [newActionNotes, setNewActionNotes] = useState('');
  const [newActionType, setNewActionType] = useState<LoopAction['action_type']>('check_in');
  const [completionData, setCompletionData] = useState({
    outcome: 'successful' as 'successful' | 'unsuccessful' | 'partial',
    satisfaction_score: 5,
    lessons_learned: ''
  });

  const { 
    addLoopAction, 
    isAddingLoopAction, 
    updateLoopStatus, 
    isUpdatingLoopStatus, 
    completeLoop, 
    isCompletingLoop 
  } = useLoops(loop?.contact_id || '');

  if (!loop) return null;

  const loopContent = loop.content as LoopArtifactContent;

  const handleStatusChange = (event: SelectChangeEvent<LoopStatus>) => {
    const newStatus = event.target.value as LoopStatus;
    if (isUpdatingLoopStatus || newStatus === loopContent.status) return;
    updateLoopStatus({ loopId: loop.id, newStatus });
  };

  const handleLogActionSubmit = () => {
    if (!newActionNotes.trim() || isAddingLoopAction) return;
    const actionToAdd: LoopAction = {
      id: crypto.randomUUID(),
      action_type: newActionType,
      notes: newActionNotes,
      status: loopContent.status,
      created_at: new Date().toISOString(),
    };
    addLoopAction({ loopId: loop.id, action: actionToAdd }, {
      onSuccess: () => {
        setNewActionNotes('');
        setNewActionType('check_in');
      }
    });
  };

  const handleCompleteLoop = () => {
    if (isCompletingLoop) return;
    completeLoop({ loopId: loop.id, outcomeData: completionData }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const sortedActions = loopContent.actions ? [...loopContent.actions].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{loopContent.title}</Typography>
        <LoopStatusBadge status={loopContent.status} />
        <IconButton onClick={onClose} sx={{ ml: 1}}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Overview</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {loopContent.description}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip label={loopContent.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small" />
                <Chip 
                  label={loopContent.reciprocity_direction === 'giving' ? 'Giving (POG)' : 'Receiving (Ask)'}
                  color={loopContent.reciprocity_direction === 'giving' ? 'success' : 'info'}
                  size="small" 
                />
                <Chip label={`Contact: ${contactName}`} variant="outlined" size="small" />
                <Chip label={`Created: ${format(new Date(loop.created_at), 'P')}`} variant="outlined" size="small" />
              </Box>
              <Box sx={{mt: 2}}>
                <FormControl size="small" sx={{ minWidth: 180 }} disabled={isUpdatingLoopStatus || isCompletingLoop}>
                    <InputLabel id="loop-status-update-label">Update Status</InputLabel>
                    <Select
                        labelId="loop-status-update-label"
                        value={loopContent.status}
                        label="Update Status"
                        onChange={handleStatusChange}
                    >
                        {Object.values(LoopStatus).map(s => (
                        <MenuItem key={s} value={s} disabled={s === LoopStatus.COMPLETED && loopContent.status !== LoopStatus.DELIVERED}>
                            {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </MenuItem>
                        ))}
                    </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: loopContent.status === LoopStatus.DELIVERED ? 7 : 12 }}>
            <Typography variant="subtitle1" gutterBottom>Progress Timeline</Typography>
            {sortedActions.length > 0 ? (
              <Timeline position="alternate">
                {sortedActions.map((action, index) => (
                  <TimelineItem key={action.id}>
                    <TimelineSeparator>
                      <TimelineDot 
                        color={action.completed_at ? 'success' : (action.status === loopContent.status ? 'primary' : 'grey')}
                        variant={action.completed_at ? 'filled' : 'outlined'}
                      />
                      {index < sortedActions.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="subtitle2" component="span">
                        {action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                       <Typography variant="caption" display="block" color="text.secondary">
                        Status: {action.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {action.completed_at 
                          ? `Completed ${formatDistanceToNow(new Date(action.completed_at), { addSuffix: true })}`
                          : action.due_date 
                          ? `Due ${formatDistanceToNow(new Date(action.due_date), { addSuffix: true })}`
                          : `Logged ${formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}`}
                      </Typography>
                      {action.notes && (
                        <Paper elevation={0} sx={{p:1, mt:0.5, bgcolor: 'grey.100'}}>
                            <Typography variant="caption" display="block">
                            {action.notes}
                            </Typography>
                        </Paper>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography sx={{my: 2}}>No actions logged yet.</Typography>
            )}
          </Grid>
          
          {loopContent.status === LoopStatus.DELIVERED && (
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Complete This Loop</Typography>
                <Box component="form" display="flex" flexDirection="column" gap={2} mt={1}>
                   <FormControl fullWidth size="small">
                    <InputLabel id="outcome-label">Outcome</InputLabel>
                    <Select
                        labelId="outcome-label"
                        value={completionData.outcome}
                        label="Outcome"
                        onChange={(e) => 
                        setCompletionData(prev => ({ ...prev, outcome: e.target.value as typeof completionData.outcome }))
                        }
                    >
                        <MenuItem value="successful">Successful</MenuItem>
                        <MenuItem value="partial">Partial Success</MenuItem>
                        <MenuItem value="unsuccessful">Unsuccessful</MenuItem>
                    </Select>
                    </FormControl>
                  <Box>
                    <Typography component="legend" variant="caption">Satisfaction Score (1-5)</Typography>
                    <Rating
                      name="satisfaction-score"
                      value={completionData.satisfaction_score}
                      onChange={(_, newValue) => 
                        setCompletionData(prev => ({ ...prev, satisfaction_score: newValue || 0 }))
                      }
                    />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Lessons Learned / Notes"
                    value={completionData.lessons_learned}
                    onChange={(e) => 
                      setCompletionData(prev => ({ ...prev, lessons_learned: e.target.value }))
                    }
                    variant="outlined"
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleCompleteLoop} 
                    disabled={isCompletingLoop || isUpdatingLoopStatus}
                  >
                    {isCompletingLoop ? 'Completing...' : 'Mark as Completed'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

          {loopContent.contact_feedback && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'secondary.light' }}>
                <Typography variant="subtitle1" gutterBottom>Contact Feedback</Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2">Rating:</Typography>
                  <Rating value={loopContent.contact_feedback.rating} readOnly size="small" />
                </Box>
                {loopContent.contact_feedback.comments && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <em>"{loopContent.contact_feedback.comments}"</em>
                  </Typography>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Received {formatDistanceToNow(new Date(loopContent.contact_feedback.received_at), { addSuffix: true })}
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Log Manual Action</Typography>
                <FormControl fullWidth margin="dense" size="small">
                    <InputLabel id="new-action-type-label">Action Type</InputLabel>
                    <Select
                    labelId="new-action-type-label"
                    value={newActionType}
                    name="newActionType"
                    label="Action Type"
                    onChange={(e: SelectChangeEvent<LoopAction['action_type']>) => setNewActionType(e.target.value as LoopAction['action_type'])}
                    >
                    <MenuItem value="offer">Offer</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                    <MenuItem value="follow_up">Follow-up</MenuItem>
                    <MenuItem value="check_in">Check-in</MenuItem>
                    <MenuItem value="approval_request">Approval Request</MenuItem>
                    <MenuItem value="completion">Completion Note</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    fullWidth
                    margin="dense"
                    label="Action Notes / Description"
                    multiline
                    rows={2}
                    value={newActionNotes}
                    onChange={(e) => setNewActionNotes(e.target.value)}
                    variant="outlined"
                    size="small"
                />
                <Button 
                    variant="outlined" 
                    onClick={handleLogActionSubmit}
                    startIcon={<AddIcon />}
                    disabled={!newActionNotes.trim() || isAddingLoopAction}
                    sx={{mt:1}}
                    size="small"
                >
                    {isAddingLoopAction ? 'Logging Action...' : 'Log Action'}
                </Button>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{pb:2, px:3}}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 