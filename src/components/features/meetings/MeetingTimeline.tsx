'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { MeetingArtifact } from '@/types/artifact';

interface MeetingTimelineProps {
  meetings: MeetingArtifact[];
  onMeetingClick?: (meeting: MeetingArtifact) => void;
}

export const MeetingTimeline: React.FC<MeetingTimelineProps> = ({
  meetings,
  onMeetingClick,
}) => {
  // Sort meetings by date (most recent first)
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedMeetings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No meetings found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your meetings will appear here once you sync your calendar or add them manually.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {sortedMeetings.map((meeting) => (
        <Card key={meeting.id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => onMeetingClick?.(meeting)}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6" component="div" gutterBottom>
                {meeting.content?.title || 'Meeting'}
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
                {format(new Date(meeting.timestamp), 'MMM d, yyyy • h:mm a')}
              </Typography>
            </Box>

            {meeting.content?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                <LocationOnIcon fontSize="inherit" />
                <Typography variant="body2">{meeting.content.location}</Typography>
              </Box>
            )}

            {meeting.content?.attendees && meeting.content.attendees.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                <PeopleIcon fontSize="small" />
                <Typography variant="body2">
                  {meeting.content.attendees.length} attendee{meeting.content.attendees.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {meeting.ai_parsing_status === 'pending' || meeting.ai_parsing_status === 'processing' ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HourglassEmptyIcon fontSize="small" />
                  <Typography variant="body2">
                    AI processing: {meeting.ai_parsing_status}...
                  </Typography>
                  {meeting.ai_parsing_status === 'processing' && <LinearProgress sx={{ width: 100 }} />}
                </Box>
              </Alert>
            ) : meeting.ai_parsing_status === 'failed' ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorOutlineIcon fontSize="small" />
                  <Typography variant="body2">AI processing failed</Typography>
                </Box>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}; 