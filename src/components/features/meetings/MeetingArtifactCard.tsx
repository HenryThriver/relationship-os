'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Notes as NotesIcon,
  Mic as MicIcon,
  Videocam as VideocamIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorOutlineIcon,
  HourglassEmpty as HourglassEmptyIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  FlagOutlined as FlagOutlinedIcon,
  Link as LinkIcon,
  NoteAdd as NoteAddIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  CloudUpload as CloudUploadIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import type { MeetingArtifact, MeetingArtifactContent } from '@/types/artifact';

// Type aliases for convenience
type ActionItem = NonNullable<NonNullable<MeetingArtifactContent['insights']>['actionItems']>[number];
type FollowUpSuggestion = NonNullable<NonNullable<MeetingArtifactContent['insights']>['followUpSuggestions']>[number];
type MeetingAttendee = NonNullable<MeetingArtifactContent['attendees']>[number];

interface MeetingArtifactCardProps {
  artifact: MeetingArtifact;
  onOpenModal?: (artifact: MeetingArtifact) => void;
  onAddContent?: (artifact: MeetingArtifact, contentType: 'notes' | 'transcript' | 'recording') => void;
  onUpdateActionItem?: (artifactId: string, actionItemId: string, completed: boolean) => void;
  onApplySuggestion?: (artifactId: string, suggestionId: string) => void;
  onViewDetails?: (artifactId: string) => void;
  className?: string;
}

export const MeetingArtifactCard: React.FC<MeetingArtifactCardProps> = ({
  artifact,
  onOpenModal,
  onAddContent,
  onUpdateActionItem,
  onApplySuggestion,
  onViewDetails,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { id, content, metadata, ai_parsing_status, timestamp } = artifact;
  const meetingContent = content as MeetingArtifactContent;
  const insights = meetingContent.insights;

  const formatMeetingTime = (start: Date | string | undefined, end: Date | string | undefined): string => {
    try {
      // Handle cases where start/end might be undefined or invalid
      if (!start || !end) {
        return 'Time not available';
      }
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Time not available';
      }
      
      return `${format(startDate, 'p')} - ${format(endDate, 'p')} (${format(startDate, 'MMM d, yyyy')})`;
    } catch (error) {
      console.error('Error formatting meeting time:', error);
      return 'Time not available';
    }
  };

  // Get meeting times from either content or metadata (Google Calendar sync stores in metadata)
  const getMeetingTimes = () => {
    // Try to get from content first (manual meetings)
    if (meetingContent.startTime && meetingContent.endTime) {
      return {
        startTime: meetingContent.startTime,
        endTime: meetingContent.endTime
      };
    }
    
    // Fall back to metadata (Google Calendar sync)
    const metadataAny = metadata as any;
    if (metadataAny?.meeting_date) {
      const meetingDate = metadataAny.meeting_date;
      const durationMinutes = metadataAny.duration_minutes || 60; // Default to 1 hour
      
      const startTime = new Date(meetingDate);
      const endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
      
      return {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
    }
    
    return {
      startTime: undefined,
      endTime: undefined
    };
  };

  const { startTime, endTime } = getMeetingTimes();

  const meetingDate = metadata?.meeting_date ? new Date(metadata.meeting_date) : new Date(timestamp);
  const isUpcoming = meetingDate > new Date();
  const isPast = meetingDate < new Date();

  const getStatusColor = (): 'default' | 'primary' | 'secondary' | 'success' | 'warning' => {
    if (isUpcoming) return 'primary';
    if (isPast) return 'default';
    return 'secondary';
  };

  const getStatusLabel = (): string => {
    if (isUpcoming) return 'Upcoming';
    if (isPast) return 'Completed';
    return 'In Progress';
  };

  const hasContent = Boolean(
    meetingContent.notes || 
    meetingContent.transcript || 
    (meetingContent.insights?.summary && meetingContent.insights.summary.trim() !== '')
  );

  const actionItems: ActionItem[] = metadata?.insights?.actionItems || [];
  const completedItems = actionItems.filter((item: ActionItem) => item.completed).length;

  const getProcessingStatusIndicator = () => {
    if (ai_parsing_status === 'pending' || ai_parsing_status === 'processing') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
          <HourglassEmptyIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            AI processing: {ai_parsing_status}...
          </Typography>
          {ai_parsing_status === 'processing' && <LinearProgress sx={{ width: '50px' }} />}
        </Box>
      );
    }
    if (ai_parsing_status === 'failed') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
          <ErrorOutlineIcon fontSize="small" color="error" />
          <Typography variant="caption" color="error">
            AI processing failed
          </Typography>
        </Box>
      );
    }
    if (ai_parsing_status === 'completed' && !insights) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
            <InfoIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              AI processing completed, no significant insights found.
            </Typography>
          </Box>
        );
    }
    return null;
  };

  return (
    <Card className={className} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }} onClick={() => onOpenModal?.(artifact)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" gutterBottom>
            {meetingContent.title || (metadata as any)?.title || 'Meeting'}
          </Typography>
          <Tooltip title="More options">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Handle menu */}}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
          <EventIcon fontSize="inherit" />
          <Typography variant="body2">
            {formatMeetingTime(startTime, endTime)}
          </Typography>
        </Box>

        {(meetingContent.location || (metadata as any)?.location) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
            <LocationOnIcon fontSize="inherit" />
            <Typography variant="body2">{meetingContent.location || (metadata as any)?.location}</Typography>
          </Box>
        )}

        {/* Get attendees from either content or metadata */}
        {(() => {
          const contentAttendees = meetingContent.attendees || [];
          const metadataAttendees = (metadata as any)?.attendees || [];
          const allAttendees = contentAttendees.length > 0 ? contentAttendees : metadataAttendees.map((name: string) => ({ name, email: name }));
          
          return allAttendees.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
              <PeopleIcon fontSize="small" />
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                {allAttendees.map((attendee: MeetingAttendee | string, index: number) => {
                  const attendeeName = typeof attendee === 'string' ? attendee : (attendee.name || attendee.email);
                  const attendeeEmail = typeof attendee === 'string' ? attendee : attendee.email;
                  return (
                    <Tooltip key={attendeeEmail || attendeeName || index} title={attendeeName || attendeeEmail}>
                      <Avatar alt={attendeeName || attendeeEmail} />
                    </Tooltip>
                  );
                })}
              </AvatarGroup>
              <Typography variant="body2" sx={{ml: 0.5}}>
                  {allAttendees.length} attendee{allAttendees.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          );
        })()}
        
        {getProcessingStatusIndicator()}

        {(meetingContent.notes || meetingContent.transcript) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }} noWrap>
                Preview: {meetingContent.notes?.substring(0,100) || meetingContent.transcript?.substring(0,100)}...
            </Typography>
        )}

        {insights && (
          <>
            <Divider sx={{ my: 1.5 }} />
            {insights.actionItems && insights.actionItems.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FlagOutlinedIcon fontSize="small"/> Action Items
                </Typography>
                <List dense disablePadding>
                  {insights.actionItems.slice(0, 3).map((item: ActionItem) => (
                    <ListItem key={item.id || item.description} disablePadding sx={{ pl: 1}}>
                      <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                        <Tooltip title={item.completed ? "Mark as incomplete" : "Mark as complete"}>
                          <Checkbox
                            edge="start"
                            checked={!!item.completed}
                            icon={<RadioButtonUncheckedIcon />}
                            checkedIcon={<CheckCircleOutlineIcon />}
                            onChange={(e) => {
                                e.stopPropagation();
                                onUpdateActionItem?.(id, item.id || '', e.target.checked)
                            }}
                            size="small"
                          />
                        </Tooltip>
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.description} 
                        primaryTypographyProps={{ 
                            variant: 'body2', 
                            sx: { textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.disabled' : 'text.primary'} 
                        }}
                        secondary={item.assignee || item.dueDate ? `Assigned to: ${item.assignee || 'N/A'} ${item.dueDate ? '• Due: ' + format(new Date(item.dueDate), 'MMM d') : ''}` : null}
                        secondaryTypographyProps={{variant: 'caption'}}
                       />
                    </ListItem>
                  ))}
                </List>
                {insights.actionItems.length > 3 && (
                    <Button size="small" sx={{textTransform: 'none', ml:1}} onClick={(e) => {e.stopPropagation(); onOpenModal?.(artifact);}}>
                        View all {insights.actionItems.length} action items
                    </Button>
                )}
              </Box>
            )}

            {insights.keyTopics && insights.keyTopics.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LightbulbOutlinedIcon fontSize="small"/> Key Topics
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {insights.keyTopics.map((topic: string) => (
                    <Chip key={topic} label={topic} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
        
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
          <Tooltip title="Add Notes">
            <Button size="small" startIcon={<NoteAddIcon />} variant="outlined" onClick={(e) => {e.stopPropagation(); onAddContent?.(artifact, 'notes')}}>
              Notes
            </Button>
          </Tooltip>
          <Tooltip title="Add Transcript">
            <Button size="small" startIcon={<RecordVoiceOverIcon />} variant="outlined" onClick={(e) => {e.stopPropagation(); onAddContent?.(artifact, 'transcript')}}>
              Transcript
            </Button>
          </Tooltip>
           <Tooltip title="Upload Recording">
            <Button size="small" startIcon={<CloudUploadIcon />} variant="outlined" onClick={(e) => {e.stopPropagation(); onAddContent?.(artifact, 'recording')}}>
              Recording
            </Button>
          </Tooltip>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" gap={1}>
            {onAddContent && (
              <>
                <Button
                  size="small"
                  startIcon={<NoteAddIcon />}
                  onClick={(e) => { e.stopPropagation(); onAddContent(artifact, 'notes'); }}
                >
                  Add Notes
                </Button>
                <Button
                  size="small"
                  startIcon={<RecordVoiceOverIcon />}
                  onClick={(e) => { e.stopPropagation(); onAddContent(artifact, 'transcript'); }}
                >
                  Add Transcript
                </Button>
                <Button
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={(e) => { e.stopPropagation(); onAddContent(artifact, 'recording'); }}
                >
                  Upload Recording
                </Button>
              </>
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              aria-label={expanded ? 'Show less' : 'Show more'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            {onViewDetails && (
              <Button
                size="small"
                onClick={(e) => { e.stopPropagation(); onViewDetails(id); }}
              >
                View Details
              </Button>
            )}
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
}; 