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
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  LocationOn,
  People,
  ExpandMore,
  ExpandLess,
  NoteAdd,
  RecordVoiceOver,
  CloudUpload,
  OpenInNew,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import type { MeetingArtifact, MeetingArtifactMetadata } from '@/types/artifact';

interface MeetingArtifactCardProps {
  artifact: MeetingArtifact;
  onAddContent?: (artifactId: string, contentType: 'notes' | 'transcript' | 'recording') => void;
  onViewDetails?: (artifactId: string) => void;
  className?: string;
}

export const MeetingArtifactCard: React.FC<MeetingArtifactCardProps> = ({
  artifact,
  onAddContent,
  onViewDetails,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const metadata = artifact.metadata as MeetingArtifactMetadata;

  const meetingDate = metadata?.meeting_date ? new Date(metadata.meeting_date) : new Date(artifact.timestamp);
  const isUpcoming = meetingDate > new Date();
  const isPast = meetingDate < new Date();

  const formatMeetingTime = (date: Date): string => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else if (isPast) {
      return `${formatDistanceToNow(date, { addSuffix: true })} • ${format(date, 'MMM d, h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy • h:mm a');
    }
  };

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
    artifact.content && artifact.content !== metadata?.title &&
    artifact.content !== 'Meeting'
  );

  const actionItems = metadata?.insights?.actionItems || [];
  const completedItems = actionItems.filter((item) => item.completed).length;

  return (
    <Card className={className} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <VideoCall sx={{ mr: 2, color: 'primary.main' }} />
            <Box flex={1}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                {metadata?.title || artifact.content || 'Meeting'}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  label={getStatusLabel()}
                  color={getStatusColor()}
                  size="small"
                  variant="outlined"
                />
                {metadata?.calendar_source === 'google' && (
                  <Chip
                    label="📅 Google Calendar"
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Meeting Details */}
        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          <Box display="flex" alignItems="center">
            <Schedule sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              {formatMeetingTime(meetingDate)}
              {metadata?.duration_minutes && (
                <span> • {metadata.duration_minutes} minutes</span>
              )}
            </Typography>
          </Box>

          {metadata?.location && (
            <Box display="flex" alignItems="center">
              <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                {metadata.location}
              </Typography>
            </Box>
          )}

          {metadata?.attendees && metadata.attendees.length > 0 && (
            <Box display="flex" alignItems="center">
              <People sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                {metadata.attendees.length} attendee{metadata.attendees.length !== 1 ? 's' : ''}
              </Typography>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                {metadata.attendees.slice(0, 4).map((attendee, index) => (
                  <Avatar key={index} sx={{ bgcolor: 'primary.main' }}>
                    {attendee.charAt(0).toUpperCase()}
                  </Avatar>
                ))}
              </AvatarGroup>
            </Box>
          )}
        </Box>

        {/* Content Status */}
        {hasContent && (
          <Box mb={2}>
            <Chip
              icon={<Assignment />}
              label="Has meeting content"
              color="success"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        {/* Action Items Summary */}
        {actionItems.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Action Items ({completedItems}/{actionItems.length} completed)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {actionItems.slice(0, 3).map((item, index) => (
                <Chip
                  key={index}
                  icon={item.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                  label={item.description}
                  size="small"
                  color={item.completed ? 'success' : 'default'}
                  variant="outlined"
                />
              ))}
              {actionItems.length > 3 && (
                <Chip
                  label={`+${actionItems.length - 3} more`}
                  size="small"
                  variant="outlined"
                  onClick={() => setExpanded(!expanded)}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* All Action Items */}
          {actionItems.length > 3 && (
            <Box mb={2}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>All Action Items</Typography>
              <List dense>
                {actionItems.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {item.completed ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.description}
                      secondary={item.assignee && `Assigned to: ${item.assignee}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Meeting Links */}
          {(metadata?.google_calendar_html_link || metadata?.google_calendar_link) && (
            <Box mb={2}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Meeting Links</Typography>
              <Box display="flex" gap={1}>
                {metadata.google_calendar_html_link && (
                  <Link
                    href={metadata.google_calendar_html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <OpenInNew fontSize="small" />
                    Calendar Event
                  </Link>
                )}
                {metadata.google_calendar_link && (
                  <Link
                    href={metadata.google_calendar_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <VideoCall fontSize="small" />
                    Join Meeting
                  </Link>
                )}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" gap={1}>
            {onAddContent && (
              <>
                <Button
                  size="small"
                  startIcon={<NoteAdd />}
                  onClick={() => onAddContent(artifact.id, 'notes')}
                >
                  Add Notes
                </Button>
                <Button
                  size="small"
                  startIcon={<RecordVoiceOver />}
                  onClick={() => onAddContent(artifact.id, 'transcript')}
                >
                  Add Transcript
                </Button>
                <Button
                  size="small"
                  startIcon={<CloudUpload />}
                  onClick={() => onAddContent(artifact.id, 'recording')}
                >
                  Upload Recording
                </Button>
              </>
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Show less' : 'Show more'}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            {onViewDetails && (
              <Button
                size="small"
                onClick={() => onViewDetails(artifact.id)}
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