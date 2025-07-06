import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Rating,
  TextField,
  Alert,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent as MuiTimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Loop as LoopIcon,
  Timeline as TimelineIcon,
  Assessment as AnalyticsIcon,
  Comment as CommentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { LoopArtifact, LoopStatus, LoopArtifactContent } from '@/types/artifact';
import { LoopStatusBadge } from '@/components/ui/LoopStatusBadge';
import { ArtifactSuggestions } from '@/components/features/suggestions/ArtifactSuggestions';

interface EnhancedLoopModalProps {
  open: boolean;
  onClose: () => void;
  artifact: LoopArtifact | null;
  contactName: string;
  contactId?: string;
  onStatusUpdate: (loopId: string, newStatus: LoopStatus) => void;
  onEdit: (loopId: string, updates: Partial<LoopArtifactContent>) => void;
  onDelete: (loopId: string) => void;
  onShare: (loopId: string) => void;
  onComplete: (loopId: string, outcome: Partial<Pick<LoopArtifactContent, 'outcome' | 'satisfaction_score' | 'lessons_learned'>>) => void;
}

const STATUS_ICONS_MODAL: Record<LoopStatus, React.ReactNode> = {
  [LoopStatus.IDEA]: <LoopIcon fontSize="small" />,
  [LoopStatus.QUEUED]: <ScheduleIcon fontSize="small" />,
  [LoopStatus.OFFERED]: <ShareIcon fontSize="small" />,
  [LoopStatus.RECEIVED]: <ShareIcon fontSize="small" style={{ transform: 'scaleX(-1)' }} />,
  [LoopStatus.ACCEPTED]: <CheckCircleOutlineIcon fontSize="small" />,
  [LoopStatus.DECLINED]: <WarningIcon fontSize="small" />,
  [LoopStatus.IN_PROGRESS]: <LoopIcon fontSize="small" />,
  [LoopStatus.PENDING_APPROVAL]: <TimeIcon fontSize="small" />,
  [LoopStatus.DELIVERED]: <CheckIcon fontSize="small" />,
  [LoopStatus.FOLLOWING_UP]: <CommentIcon fontSize="small" />,
  [LoopStatus.COMPLETED]: <CheckIcon fontSize="small" />,
  [LoopStatus.ABANDONED]: <DeleteIcon fontSize="small" />
};
const getStatusIconModal = (status: LoopStatus) => STATUS_ICONS_MODAL[status] || <LoopIcon fontSize="small" />;

export const EnhancedLoopModal: React.FC<EnhancedLoopModalProps> = ({
  open,
  onClose,
  artifact,
  contactName,
  contactId,
  onStatusUpdate,
  onEdit,
  onDelete,
  onShare,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [completionData, setCompletionData] = useState<Partial<Pick<LoopArtifactContent, 'outcome' | 'satisfaction_score' | 'lessons_learned'>>>({
    outcome: 'successful',
    satisfaction_score: 5,
    lessons_learned: ''
  });

  useEffect(() => {
    if (artifact?.content) {
      // Reset completion data when artifact changes or modal opens
      setCompletionData({
        outcome: artifact.content.outcome || 'successful',
        satisfaction_score: artifact.content.satisfaction_score || 5,
        lessons_learned: artifact.content.lessons_learned || ''
      });
    } else {
      setCompletionData({ outcome: 'successful', satisfaction_score: 5, lessons_learned: '' });
    }
  }, [artifact, open]);

  if (!artifact) return null;

  const content = artifact.content as LoopArtifactContent; // Cast, assuming content is always LoopArtifactContent for a LoopArtifact
  
  const completedActions = content.actions?.filter(action => action.completed_at).length || 0;
  const totalActions = content.actions?.length || 0;
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : (content.status === LoopStatus.COMPLETED ? 100 : 0);

  const getNextActions = (): LoopStatus[] => {
    const transitions: Record<LoopStatus, LoopStatus[]> = {
      [LoopStatus.IDEA]: [LoopStatus.QUEUED, LoopStatus.ABANDONED],
      [LoopStatus.QUEUED]: content.reciprocity_direction === 'giving' ? [LoopStatus.OFFERED, LoopStatus.ABANDONED] : [LoopStatus.RECEIVED, LoopStatus.ABANDONED],
      [LoopStatus.OFFERED]: [LoopStatus.ACCEPTED, LoopStatus.DECLINED, LoopStatus.ABANDONED],
      [LoopStatus.RECEIVED]: [LoopStatus.ACCEPTED, LoopStatus.DECLINED, LoopStatus.ABANDONED],
      [LoopStatus.ACCEPTED]: [LoopStatus.IN_PROGRESS, LoopStatus.ABANDONED],
      [LoopStatus.IN_PROGRESS]: [LoopStatus.DELIVERED, LoopStatus.PENDING_APPROVAL, LoopStatus.ABANDONED],
      [LoopStatus.PENDING_APPROVAL]: [LoopStatus.IN_PROGRESS, LoopStatus.DELIVERED, LoopStatus.ABANDONED],
      [LoopStatus.DELIVERED]: [LoopStatus.FOLLOWING_UP, LoopStatus.COMPLETED, LoopStatus.ABANDONED],
      [LoopStatus.FOLLOWING_UP]: [LoopStatus.COMPLETED, LoopStatus.ABANDONED],
      [LoopStatus.DECLINED]: [],
      [LoopStatus.COMPLETED]: [],
      [LoopStatus.ABANDONED]: []
    };
    return content.status ? (transitions[content.status] || []) : [];
  };

  const handleCompleteSubmit = () => {
    onComplete(artifact.id, completionData);
    // onClose(); // Typically Detail modal stays open after an action, parent might close it.
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2, // Consistent with other modals if any
          minHeight: '70vh',
          maxHeight: '90vh', // Prevent excessive height
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5}}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <LoopIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={500}>{content.title}</Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <LoopStatusBadge status={content.status} />
                <Chip
                  size="small"
                  label={content.reciprocity_direction === 'giving' ? 'Giving' : 'Receiving'}
                  color={content.reciprocity_direction === 'giving' ? 'success' : 'info'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<PersonIcon fontSize="inherit" />}
                  label={contactName}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" icon={<LoopIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Timeline" icon={<TimelineIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Analytics" icon={<AnalyticsIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                {/* Description & Context */}
                <Card variant="outlined" sx={{ mb: 2.5 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography variant="body1" paragraph sx={{whiteSpace: 'pre-wrap'}}>
                      {content.description || "No description provided."}
                    </Typography>
                    
                    {content.context && (
                      <>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 500 }}>
                          Context & Background
                        </Typography>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>
                            {content.context}
                          </Typography>
                        </Paper>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* AI Processing Status and Suggestions */}
                <Card variant="outlined" sx={{ mb: 2.5 }}>
                  <CardContent>
                    <ArtifactSuggestions
                      artifactId={artifact.id}
                      artifactType="loop"
                      aiParsingStatus={artifact.ai_parsing_status as 'pending' | 'processing' | 'completed' | 'failed'}
                      contactId={contactId}
                      compact={false}
                    />
                  </CardContent>
                </Card>

                {/* Success Criteria */}
                {content.success_criteria && content.success_criteria.length > 0 && (
                  <Card variant="outlined" sx={{ mb: 2.5 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Success Criteria</Typography>
                      <List dense disablePadding>
                        {content.success_criteria.map((criteria, idx) => (
                          <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 28, mr: 0.5}}>
                              <CheckCircleOutlineIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={criteria} primaryTypographyProps={{variant: 'body2'}} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                 {/* Progress Section */}
                <Card variant="outlined" sx={{ mb: 2.5 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Typography variant="subtitle1" fontWeight={500}>Progress</Typography>
                      <Typography variant="h5" color="primary.main" fontWeight={500}>
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      color={progress === 100 ? 'success' : 'primary'}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="right">
                      {completedActions} of {totalActions} actions completed
                    </Typography>
                  </CardContent>
                </Card>

                {/* Key Information Grid */}
                <Card variant="outlined" sx={{ mb: 2.5 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={500} gutterBottom>Details</Typography>
                    {[ 
                      { label: 'Type', value: (content.type || 'unknown').replace(/_/g, ' ') },
                      { label: 'Expected Timeline', value: `${content.expected_timeline || 'N/A'} days` },
                      { label: 'Estimated Value', value: `${content.estimated_value || 'N/A'}/5` },
                      { label: 'Urgency', value: content.urgency || 'Medium', sx: {textTransform: 'capitalize'} },
                      { label: 'Created', value: formatDistanceToNow(new Date(artifact.created_at), {addSuffix: true}) }
                    ].map(item => (
                      <Box key={item.label} display="flex" justifyContent="space-between" alignItems="center" sx={{py: 0.75}}>
                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={500} sx={item.sx}>{item.value}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Next Actions / Completion */}
            {content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED && (
               <Card variant="outlined" sx={{bgcolor: content.status === LoopStatus.DELIVERED ? 'success.50' : 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {content.status === LoopStatus.DELIVERED ? 'Ready to Complete Loop' : 'Next Actions'}
                  </Typography>
                  {content.status === LoopStatus.DELIVERED ? (
                    <Box display="flex" flexDirection="column" gap={2} mt={1.5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Outcome</InputLabel>
                        <Select
                          value={completionData.outcome || 'successful'}
                          label="Outcome"
                          onChange={(e: SelectChangeEvent<typeof completionData.outcome>) => 
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
                          value={completionData.satisfaction_score || 0}
                          onChange={(_, newValue) => 
                            setCompletionData(prev => ({ ...prev, satisfaction_score: newValue || 0 }))
                          }
                        />
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label="Lessons learned or notes (optional)"
                        value={completionData.lessons_learned || ''}
                        onChange={(e) => 
                          setCompletionData(prev => ({ ...prev, lessons_learned: e.target.value }))
                        }
                      />
                      <Button variant="contained" onClick={handleCompleteSubmit} color="success">
                        Mark as Complete & Log Outcome
                      </Button>
                    </Box>
                  ) : (
                    getNextActions().length > 0 ? (
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {getNextActions().map(nextStatus => (
                          <Button
                            key={nextStatus}
                            variant="outlined"
                            onClick={() => onStatusUpdate(artifact.id, nextStatus)}
                            startIcon={getStatusIconModal(nextStatus)}
                            sx={{textTransform: 'capitalize'}}
                          >
                            {(nextStatus || '').replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </Box>
                    ) : <Typography variant="body2" color="text.secondary">No further standard actions for current status.</Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Timeline Tab */}
        {activeTab === 1 && (
          <Timeline sx={{p:0, my: 1}}>
            {content.actions && content.actions.length > 0 ? content.actions
              .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort descending by creation
              .map((action, index) => (
              <TimelineItem key={action.id} sx={{ '&::before': { display: 'none'} }}>
                <TimelineSeparator>
                  <TimelineDot 
                    color={action.completed_at ? 'success' : 'grey'}
                    variant={action.completed_at ? 'filled' : 'outlined'}
                    sx={{p:0.5}}
                  >
                    {getStatusIconModal(action.status)}
                  </TimelineDot>
                  {index < content.actions.length - 1 && <TimelineConnector sx={{minHeight: '24px'}} />}
                </TimelineSeparator>
                
                <MuiTimelineContent sx={{ py: '8px', px: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                    <Typography variant="subtitle1" fontWeight="500" sx={{textTransform: 'capitalize'}}>
                      {(action.action_type || 'unknown').replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.completed_at 
                        ? format(new Date(action.completed_at), 'PPp')
                        : action.due_date 
                        ? `Due: ${format(new Date(action.due_date), 'P')}`
                        : `Logged: ${format(new Date(action.created_at), 'P')}`}
                    </Typography>
                  </Box>
                  
                  {action.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap'}}>
                      {action.notes}
                    </Typography>
                  )}
                  
                  {action.completed_at && (
                    <Chip 
                      size="small" 
                      label={`Completed ${formatDistanceToNow(new Date(action.completed_at), {addSuffix: true})}`}
                      color="success" 
                      variant="outlined"
                      icon={<CheckIcon fontSize="inherit"/>}
                      sx={{ mt: 0.5, height: 'auto', py: 0.25}}
                    />
                  )}
                </MuiTimelineContent>
              </TimelineItem>
            )) : (
              <Alert severity="info" sx={{mt:1}}>No actions logged for this loop yet.</Alert>
            )}
          </Timeline>
        )}

        {/* Analytics Tab */}
        {activeTab === 2 && (
          <Box>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>Total Duration</Typography>
                    <Typography variant="h5" fontWeight={500}>
                      {formatDistanceToNow(new Date(artifact.created_at))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Since creation on {format(new Date(artifact.created_at), 'P')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardContent>
                     <Typography variant="subtitle1" color="text.secondary" gutterBottom>Action Velocity</Typography>
                    <Typography variant="h5" fontWeight={500}>
                      {content.actions?.length > 0 
                        ? `${(content.actions.length / 
                          Math.max(1, Math.ceil(
                            (new Date().getTime() - new Date(artifact.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)
                          ))).toFixed(1)} actions/week`
                        : '0 actions/week'
                      }
                    </Typography>
                     <Typography variant="caption" color="text.secondary">
                      Based on {content.actions?.length || 0} actions over time.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardContent>
                     <Typography variant="subtitle1" color="text.secondary" gutterBottom>Completion Rate</Typography>
                    <Typography variant="h5" fontWeight={500}>
                      {totalActions > 0 ? `${Math.round(progress)}%` : 'N/A'}
                    </Typography>
                     <Typography variant="caption" color="text.secondary">
                      {completedActions} of {totalActions} actions completed.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {content.status === LoopStatus.COMPLETED && (content.satisfaction_score || content.lessons_learned) && (
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Final Outcome Summary</Typography>
                      {content.satisfaction_score && (
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                          <Typography variant="body1" fontWeight={500}>Satisfaction Score:</Typography>
                          <Rating value={content.satisfaction_score} readOnly />
                          <Typography variant="body1">({content.satisfaction_score}/5)</Typography>
                        </Box>
                      )}
                      {content.lessons_learned && (
                        <Box>
                          <Typography variant="body1" fontWeight={500} gutterBottom>Lessons Learned:</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap'}}>
                            {content.lessons_learned}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={() => onEdit(artifact.id, {})} startIcon={<EditIcon fontSize="small" />}>
          Edit Loop Details
        </Button>
        <Button onClick={() => onShare(artifact.id)} startIcon={<ShareIcon fontSize="small" />}>
          Share
        </Button>
        <Button onClick={() => onDelete(artifact.id)} color="error" startIcon={<DeleteIcon fontSize="small" />}>
          Delete
        </Button>
        <Box sx={{flexGrow: 1}} />
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 