'use client';

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { VideoCall, Schedule, People } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import type { MeetingArtifact, MeetingArtifactMetadata } from '@/types/artifact';

interface MeetingsListProps {
  meetings: MeetingArtifact[];
  onMeetingClick?: (meeting: MeetingArtifact) => void;
  className?: string;
}

export const MeetingsList: React.FC<MeetingsListProps> = ({
  meetings,
  onMeetingClick,
  className,
}) => {
  if (meetings.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }} className={className}>
        <Typography variant="body2" color="text.secondary">
          No meetings found. Connect your Google Calendar to automatically import meetings.
        </Typography>
      </Paper>
    );
  }

  const formatMeetingDate = (meeting: MeetingArtifact): string => {
    const metadata = meeting.metadata as MeetingArtifactMetadata;
    const meetingDate = metadata?.meeting_date ? new Date(metadata.meeting_date) : new Date(meeting.timestamp);
    
    const now = new Date();
    const isToday = meetingDate.toDateString() === now.toDateString();
    const isUpcoming = meetingDate > now;
    
    if (isToday) {
      return `Today at ${format(meetingDate, 'h:mm a')}`;
    } else if (isUpcoming) {
      return format(meetingDate, 'MMM d, yyyy • h:mm a');
    } else {
      return `${formatDistanceToNow(meetingDate, { addSuffix: true })} • ${format(meetingDate, 'MMM d')}`;
    }
  };

  const getMeetingStatus = (meeting: MeetingArtifact): { label: string; color: 'default' | 'primary' | 'success' } => {
    const metadata = meeting.metadata as MeetingArtifactMetadata;
    const meetingDate = metadata?.meeting_date ? new Date(metadata.meeting_date) : new Date(meeting.timestamp);
    const now = new Date();
    
    if (meetingDate > now) {
      return { label: 'Upcoming', color: 'primary' };
    } else if (meetingDate.toDateString() === now.toDateString()) {
      return { label: 'Today', color: 'success' };
    } else {
      return { label: 'Completed', color: 'default' };
    }
  };

  return (
    <Paper className={className}>
      <Box p={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Meetings
        </Typography>
      </Box>
      
      <List>
        {meetings.map((meeting, index) => {
          const metadata = meeting.metadata as MeetingArtifactMetadata;
          const status = getMeetingStatus(meeting);
          
          return (
            <React.Fragment key={meeting.id}>
              <ListItem
                component="div"
                onClick={() => onMeetingClick?.(meeting)}
                sx={{ 
                  py: 2,
                  cursor: onMeetingClick ? 'pointer' : 'default',
                  '&:hover': onMeetingClick ? { backgroundColor: 'action.hover' } : {}
                }}
              >
                <ListItemIcon>
                  <VideoCall color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {metadata?.title || meeting.content || 'Meeting'}
                      </Typography>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        variant="outlined"
                      />
                      {metadata?.calendar_source === 'google' && (
                        <Chip
                          label="📅"
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatMeetingDate(meeting)}
                          </Typography>
                        </Box>
                        
                        {metadata?.attendees && metadata.attendees.length > 0 && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <People fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {metadata.attendees.length} attendee{metadata.attendees.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                        
                        {metadata?.duration_minutes && (
                          <Typography variant="body2" color="text.secondary">
                            {metadata.duration_minutes}m
                          </Typography>
                        )}
                      </Box>
                      
                      {metadata?.location && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          📍 {metadata.location}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < meetings.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
}; 