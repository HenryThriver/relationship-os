import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Tooltip,
  ChipProps
} from '@mui/material';
import {
  MoreHoriz as MoreIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';
import { LoopArtifact, LoopStatus, LoopArtifactContent, LoopAction } from '@/types/artifact'; // Ensure LoopAction is imported
import { LoopStatusBadge } from '@/components/ui/LoopStatusBadge';
import { formatDistanceToNow, format } from 'date-fns'; // Import format

interface LoopCardProps {
  loop: LoopArtifact;
  contactName: string;
  onStatusUpdate: (loopId: string, newStatus: LoopStatus) => void;
  onViewDetails: (loop: LoopArtifact) => void;
  onQuickAction?: (loopId: string, actionType: string) => void;
}

// Copied from LoopStatusBadge temporarily, ideally import from a shared config if STATUS_CONFIG is used elsewhere
const STATUS_CONFIG_CARD: Record<LoopStatus, { color: ChipProps['color']; label: string }> = {
  [LoopStatus.IDEA]: { color: 'default', label: 'Idea' },
  [LoopStatus.QUEUED]: { color: 'info', label: 'Queued' },
  [LoopStatus.OFFERED]: { color: 'primary', label: 'Offered' },
  [LoopStatus.RECEIVED]: { color: 'primary', label: 'Received' },
  [LoopStatus.ACCEPTED]: { color: 'success', label: 'Accepted' },
  [LoopStatus.DECLINED]: { color: 'error', label: 'Declined' },
  [LoopStatus.IN_PROGRESS]: { color: 'warning', label: 'In Progress' },
  [LoopStatus.PENDING_APPROVAL]: { color: 'warning', label: 'Pending Approval' },
  [LoopStatus.DELIVERED]: { color: 'success', label: 'Delivered' },
  [LoopStatus.FOLLOWING_UP]: { color: 'info', label: 'Following Up' },
  [LoopStatus.COMPLETED]: { color: 'success', label: 'Completed' },
  [LoopStatus.ABANDONED]: { color: 'error', label: 'Abandoned' }
};

export const LoopCard: React.FC<LoopCardProps> = ({
  loop,
  contactName,
  onStatusUpdate,
  onViewDetails,
  onQuickAction
}) => {
  const content = loop.content as LoopArtifactContent;
  const sortedActions = content.actions ? [...content.actions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
  const nextAction = sortedActions.find(action => !action.completed_at);
  const lastCompletedAction = sortedActions.find(action => action.completed_at);
  
  const completedActionsCount = content.actions?.filter(action => action.completed_at).length || 0;
  const totalActionsCount = content.actions?.length || 0;
  const progress = totalActionsCount > 0 ? (completedActionsCount / totalActionsCount) * 100 : 0;

  const getNextStatusOptions = (currentStatus: LoopStatus): LoopStatus[] => {
    const transitions: Record<LoopStatus, LoopStatus[]> = {
      [LoopStatus.IDEA]: [LoopStatus.QUEUED, LoopStatus.ABANDONED],
      [LoopStatus.QUEUED]: [LoopStatus.OFFERED, LoopStatus.RECEIVED, LoopStatus.ABANDONED],
      [LoopStatus.OFFERED]: [LoopStatus.ACCEPTED, LoopStatus.DECLINED, LoopStatus.ABANDONED],
      [LoopStatus.RECEIVED]: [LoopStatus.ACCEPTED, LoopStatus.DECLINED],
      [LoopStatus.ACCEPTED]: [LoopStatus.IN_PROGRESS, LoopStatus.PENDING_APPROVAL],
      [LoopStatus.DECLINED]: [],
      [LoopStatus.IN_PROGRESS]: [LoopStatus.DELIVERED, LoopStatus.PENDING_APPROVAL, LoopStatus.ABANDONED],
      [LoopStatus.PENDING_APPROVAL]: [LoopStatus.IN_PROGRESS, LoopStatus.DELIVERED, LoopStatus.ABANDONED],
      [LoopStatus.DELIVERED]: [LoopStatus.FOLLOWING_UP, LoopStatus.COMPLETED],
      [LoopStatus.FOLLOWING_UP]: [LoopStatus.COMPLETED],
      [LoopStatus.COMPLETED]: [],
      [LoopStatus.ABANDONED]: []
    };
    return transitions[currentStatus] || [];
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent sx={{ pb: 1 }}> {/* Reduced paddingBottom for CardContent */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="h6" component="div" gutterBottom>
              {content.title}
            </Typography>
            <LoopStatusBadge status={content.status} />
          </Box>
          <IconButton size="small" onClick={() => onViewDetails(loop)}>
            <MoreIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ minHeight: '40px' }}> {/* Ensure description has some space */}
          {content.description}
        </Typography>

        {/* Info row */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mt={1.5} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="caption">{contactName}</Typography>
          </Box>
          
          {content.next_action_due && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <ScheduleIcon fontSize="small" color="action" />
              <Tooltip title={`Overall loop next action due: ${format(new Date(content.next_action_due), 'PPP')}`}>
                <Typography variant="caption">
                  Due {formatDistanceToNow(new Date(content.next_action_due), { addSuffix: true })}
                </Typography>
              </Tooltip>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={0.5}>
            <ProgressIcon fontSize="small" color="action" />
            <Typography variant="caption">
              {completedActionsCount}/{totalActionsCount} actions
            </Typography>
          </Box>
        </Box>

        {totalActionsCount > 0 && (
            <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 4, borderRadius: 2, mb: 1}} 
            />
        )}

        {/* Next/Last Action Details */}
        <Box mt={1} sx={{ minHeight: '36px'}}> {/* Ensure this box has some min height */}
          {nextAction ? (
            <Box>
              <Typography component="span" variant="caption" color="primary.main" sx={{ fontWeight: 'medium' }}>Next: </Typography>
              <Typography component="span" variant="caption">
                {nextAction.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {nextAction.due_date ? ` (Due: ${formatDistanceToNow(new Date(nextAction.due_date), { addSuffix: true })})` : ''}
              </Typography>
              {nextAction.notes && 
                <Tooltip title={nextAction.notes}>
                    <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Notes: {nextAction.notes}
                    </Typography>
                </Tooltip>
              }
            </Box>
          ) : lastCompletedAction ? (
            <Box>
              <Typography component="span" variant="caption" color="text.secondary">Last: </Typography>
              <Typography component="span" variant="caption">
                {lastCompletedAction.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {lastCompletedAction.completed_at ? ` (Completed: ${formatDistanceToNow(new Date(lastCompletedAction.completed_at), { addSuffix: true })})` : ''}
              </Typography>
            </Box>
          ) : totalActionsCount === 0 ? (
            <Typography variant="caption" color="text.secondary">No actions logged yet.</Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">All actions completed.</Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}> {/* pt:0 to reduce space if CardContent paddingBottom is also small */}
        <Box>
            {getNextStatusOptions(content.status).map(status => (
            <Button
                key={status}
                size="small"
                onClick={() => onStatusUpdate(loop.id, status)}
            >
                {STATUS_CONFIG_CARD[status]?.label || status}
            </Button>
            ))}
        </Box>
        <Button size="small" onClick={() => onViewDetails(loop)} sx={{ ml: 'auto'}}>
          Details
        </Button>
      </CardActions>
    </Card>
  );
}; 