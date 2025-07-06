import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Divider,
  Menu,
  MenuItem,
  Alert,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  TrendingUp as ProgressIcon,
  Flag as FlagIcon,
  Loop as LoopIcon,
  Comment as CommentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  HelpOutline as HelpOutlineIcon,
  Handshake as HandshakeIcon,
  Groups as GroupsIcon,
  PersonAdd as PersonAddIcon,
  Link as LinkIcon,
  Event as EventIcon,
  Workspaces as WorkspacesIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format, isBefore, addDays } from 'date-fns';
import { LoopArtifact, LoopStatus, LoopType, LoopArtifactContent } from '@/types/artifact';
import { LoopStatusBadge } from '@/components/ui/LoopStatusBadge';

interface EnhancedLoopTimelineProps {
  artifact: LoopArtifact;
  contactName: string;
  onStatusUpdate: (loopId: string, newStatus: LoopStatus) => void;
  onEdit: (loopId: string, updates: Partial<LoopArtifactContent>) => void;
  onDelete: (loopId: string) => void;
  onShare: (loopId: string) => void;
  onAddNote: (loopId: string, note: string) => void;
}

const STATUS_ICONS: Record<LoopStatus, React.ReactNode> = {
  [LoopStatus.IDEA]: <LoopIcon fontSize="small" />,
  [LoopStatus.QUEUED]: <ScheduleIcon fontSize="small" />,
  [LoopStatus.OFFERED]: <ShareIcon fontSize="small" />,
  [LoopStatus.RECEIVED]: <ShareIcon fontSize="small" style={{ transform: 'scaleX(-1)' }} />,
  [LoopStatus.ACCEPTED]: <CheckCircleOutlineIcon fontSize="small" />,
  [LoopStatus.DECLINED]: <WarningIcon fontSize="small" />,
  [LoopStatus.IN_PROGRESS]: <LoopIcon fontSize="small" />,
  [LoopStatus.PENDING_APPROVAL]: <TimeIcon fontSize="small" />,
  [LoopStatus.DELIVERED]: <CompleteIcon fontSize="small" />,
  [LoopStatus.FOLLOWING_UP]: <CommentIcon fontSize="small" />,
  [LoopStatus.COMPLETED]: <CompleteIcon fontSize="small" />,
  [LoopStatus.ABANDONED]: <DeleteIcon fontSize="small" />
};

const LOOP_TYPE_ICONS: Record<LoopType, React.ReactNode> = {
  [LoopType.INTRODUCTION]: <PersonIcon fontSize="small" />,
  [LoopType.REFERRAL]: <ShareIcon fontSize="small" />,
  [LoopType.RESOURCE_SHARE]: <DescriptionIcon fontSize="small" />,
  [LoopType.ADVICE_OFFER]: <SchoolIcon fontSize="small" />,
  [LoopType.ADVICE_REQUEST]: <HelpOutlineIcon fontSize="small" />,
  [LoopType.COLLABORATION_PROPOSAL]: <HandshakeIcon fontSize="small" />,
  [LoopType.CONNECTION_FACILITATION]: <GroupsIcon fontSize="small" />,
  [LoopType.INTRODUCTION_REQUEST]: <PersonAddIcon fontSize="small" />,
  [LoopType.REFERRAL_REQUEST]: <LinkIcon fontSize="small" />,
  [LoopType.MEETING_COORDINATION]: <EventIcon fontSize="small" />,
  [LoopType.PROJECT_COLLABORATION]: <WorkspacesIcon fontSize="small" />,
};

const getLoopTypeIcon = (type: LoopType) => LOOP_TYPE_ICONS[type] || <LoopIcon fontSize="small" />;
const getStatusIcon = (status: LoopStatus) => STATUS_ICONS[status] || <LoopIcon fontSize="small" />;

export const EnhancedLoopTimeline: React.FC<EnhancedLoopTimelineProps> = ({
  artifact,
  contactName,
  onStatusUpdate,
  onEdit,
  onDelete,
  onShare,
  onAddNote
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const content = artifact.content as LoopArtifactContent;
  
  const completedActions = content.actions?.filter(action => action.completed_at).length || 0;
  const totalActions = content.actions?.length || 0;
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : (content.status === LoopStatus.COMPLETED ? 100 : 0);

  const isOverdue = content.next_action_due && 
    isBefore(new Date(content.next_action_due), new Date()) && content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED;
  
  const isDueSoon = content.next_action_due && 
    isBefore(new Date(content.next_action_due), addDays(new Date(), 3)) &&
    !isOverdue && content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED;

  const getUrgencyChipColor = (): 'error' | 'warning' | 'info' | 'default' => {
    if (content.urgency === 'high') return 'error';
    if (content.urgency === 'medium') return 'warning';
    return 'info';
  };

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

  const handleAddNoteSubmit = () => {
    if (newNote.trim()) {
      onAddNote(artifact.id, newNote);
      setNewNote('');
      setNoteDialogOpen(false);
    }
  };

  if (!content) {
    return <Card variant="outlined" sx={{ mb: 2}}><CardContent><Typography>Invalid loop data.</Typography></CardContent></Card>;
  }

  return (
    <>
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 2,
          transition: 'box-shadow 0.3s ease-in-out',
          borderLeft: `4px solid`,
          borderColor: isOverdue ? 'error.main' : (isDueSoon ? 'warning.main' : 'transparent'),
          '&:hover': { boxShadow: (theme) => theme.shadows[3] }
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 36, height: 36 }}>
                {getLoopTypeIcon(content.type)}
              </Avatar>
              
              <Box flex={1} minWidth={0}>
                <Typography variant="h6" component="div" noWrap gutterBottom sx={{fontWeight: 500, fontSize: '1.1rem'}} title={content.title}>
                  {content.title}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                  <LoopStatusBadge status={content.status} />
                  
                  <Chip
                    size="small"
                    label={content.reciprocity_direction === 'giving' ? 'Giving' : 'Receiving'}
                    color={content.reciprocity_direction === 'giving' ? 'success' : 'info'}
                    variant="outlined"
                    sx={{ height: 'auto', py: 0.25}}
                  />
                  
                  {content.urgency && (
                    <Chip
                      size="small"
                      icon={<FlagIcon fontSize="inherit" />}
                      label={content.urgency.charAt(0).toUpperCase() + content.urgency.slice(1)}
                      color={getUrgencyChipColor()}
                      variant="outlined"
                      sx={{ height: 'auto', py: 0.25}}
                    />
                  )}
                  
                  <Chip
                    size="small"
                    icon={<PersonIcon fontSize="inherit" />}
                    label={contactName}
                    variant="outlined"
                    sx={{ height: 'auto', py: 0.25}}
                  />
                </Box>
              </Box>
            </Box>

            <IconButton 
              size="small" 
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ alignSelf: 'flex-start' }}
            >
              <MoreIcon />
            </IconButton>
          </Box>

          {content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED && (
            <Box mb={1.5}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progress: {completedActions}/{totalActions} actions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 6, borderRadius: 3 }}
                color={progress === 100 ? 'success' : 'primary'}
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" mb={1.5} noWrap>
            {content.description}
          </Typography>

          <Box display="flex" alignItems="center" gap={2} mb={1.5} flexWrap="wrap" sx={{fontSize: '0.8rem'}}>
            {content.expected_timeline && (
              <Tooltip title="Expected Timeline">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TimeIcon fontSize="inherit" color="action" />
                  <Typography variant="caption">
                    {content.expected_timeline} days
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {content.next_action_due && content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED && (
               <Tooltip title={`Next Action Due: ${format(new Date(content.next_action_due), 'PPp')}`}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon 
                    fontSize="inherit" 
                    color={isOverdue ? 'error' : isDueSoon ? 'warning' : 'action'} 
                  />
                  <Typography 
                    variant="caption"
                    color={isOverdue ? 'error' : isDueSoon ? 'warning.main' : 'text.secondary'}
                  >
                    {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(new Date(content.next_action_due), { addSuffix: true })}
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {content.estimated_value && (
              <Tooltip title="Estimated Value">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ProgressIcon fontSize="inherit" color="action" />
                  <Typography variant="caption">
                    Value: {content.estimated_value}/5
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {artifact.created_at && (
              <Tooltip title={`Created: ${format(new Date(artifact.created_at), 'PPp')}`}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          {isOverdue && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0, px: 1 }} icon={<WarningIcon fontSize="inherit" />}>
              <Typography variant="caption">This loop has overdue actions.</Typography>
            </Alert>
          )}
          {isDueSoon && !isOverdue && (
             <Alert severity="warning" sx={{ mb: 1.5, py: 0, px: 1 }} icon={<ScheduleIcon fontSize="inherit" />}>
              <Typography variant="caption">Action due soon.</Typography>
            </Alert>
          )}

          {getNextActions().length > 0 && content.status !== LoopStatus.COMPLETED && content.status !== LoopStatus.ABANDONED && (
            <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
              {getNextActions().map(nextStatus => (
                <Button
                  key={nextStatus}
                  size="small"
                  variant="outlined"
                  onClick={() => onStatusUpdate(artifact.id, nextStatus)}
                  startIcon={getStatusIcon(nextStatus)}
                  sx={{textTransform: 'capitalize'}}
                >
                  {nextStatus.replace(/_/g, ' ')}
                </Button>
              ))}
            </Box>
          )}
            
          <Box textAlign="right">
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
            >
              {expanded ? 'Hide Details' : 'Show Details'} ({content.actions?.length || 0} actions)
            </Button>
          </Box>
          
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1.5 }} />
            
            {content.context && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Context & Background
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: (theme) => theme.palette.grey[50] }}>
                  <Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>
                    {content.context}
                  </Typography>
                </Paper>
              </Box>
            )}

            {content.success_criteria && content.success_criteria.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Success Criteria
                </Typography>
                <List dense disablePadding>
                  {content.success_criteria.map((criteria, idx) => (
                    <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28, mr: 0.5}}>
                        <CheckCircleOutlineIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={criteria}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Action Timeline
              </Typography>
              
              {content.actions && content.actions.length > 0 ? (
                <Timeline sx={{ p: 0, m: 0}}>
                  {content.actions.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((action, index) => (
                    <TimelineItem key={action.id} sx={{ '&::before': { display: 'none'} }}>
                      <TimelineSeparator>
                        <TimelineDot 
                          color={action.completed_at ? 'success' : 'grey'}
                          variant={action.completed_at ? 'filled' : 'outlined'}
                          sx={{p: 0.5}}
                        >
                          {getStatusIcon(action.status)} 
                        </TimelineDot>
                        {index < content.actions.length - 1 && <TimelineConnector sx={{minHeight: '20px'}} />}
                      </TimelineSeparator>
                      
                      <TimelineContent sx={{ py: '6px', px: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight="500" sx={{textTransform: 'capitalize'}}>
                            {action.action_type.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.completed_at 
                              ? format(new Date(action.completed_at), 'MMM d, h:mm a')
                              : action.due_date 
                              ? `Due ${format(new Date(action.due_date), 'MMM d')}`
                              : format(new Date(action.created_at), 'MMM d') }
                          </Typography>
                        </Box>
                        
                        {action.notes && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}>
                            {action.notes}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{pl: 1}}>No actions logged yet.</Typography>
              )}
            </Box>

            {content.status === LoopStatus.COMPLETED && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Outcome & Results
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'success.50' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body2" fontWeight="500">
                      Outcome: {content.outcome ? content.outcome.charAt(0).toUpperCase() + content.outcome.slice(1) : 'Successful'}
                    </Typography>
                    {content.satisfaction_score && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2">Rating:</Typography>
                        <Box display="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Typography 
                              key={star}
                              component="span"
                              sx={{ 
                                color: star <= content.satisfaction_score! ? 'warning.main' : 'text.disabled',
                                fontSize: '1.1em'
                              }}
                            >
                              ★
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  {content.lessons_learned && (
                    <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap'}}>
                      Lessons Learned: {content.lessons_learned}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { onEdit(artifact.id, content); setMenuAnchor(null); }}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Edit Loop
        </MenuItem>
        <MenuItem onClick={() => { onShare(artifact.id); setMenuAnchor(null); }}>
          <ShareIcon fontSize="small" sx={{ mr: 1.5 }} /> Share with Contact
        </MenuItem>
         <MenuItem onClick={() => { setNoteDialogOpen(true); setMenuAnchor(null); }}>
          <CommentIcon fontSize="small" sx={{ mr: 1.5 }} /> Add Note/Action
        </MenuItem>
        <Divider sx={{my: 0.5}} />
        <MenuItem 
          onClick={() => { onDelete(artifact.id); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete Loop
        </MenuItem>
      </Menu>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note to Loop: {content.title}</DialogTitle>
        <MuiDialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note / Action Taken"
            placeholder="Log a quick update, action taken, or any thoughts related to this loop..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
            autoFocus
          />
        </MuiDialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNoteSubmit} variant="contained" disabled={!newNote.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 