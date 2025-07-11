'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  FlagOutlined as FlagOutlinedIcon,
  TrendingUp as TrendingUpIcon,
  Notes as NotesIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import type { MeetingArtifact, MeetingArtifactContent } from '@/types/artifact';
import type { ActionItem, FollowUpSuggestion, MeetingAttendee } from '@/types/meetings';
import { ArtifactSuggestions } from '@/components/features/suggestions/ArtifactSuggestions';

interface MeetingDetailModalProps {
  open: boolean;
  onClose: () => void;
  meeting: MeetingArtifact;
  onUpdateActionItem?: (artifactId: string, actionItemId: string, completed: boolean) => void;
  onApplySuggestion?: (artifactId: string, suggestionId: string) => void;
  onAddContent?: (meeting: MeetingArtifact, contentType: 'notes' | 'transcript' | 'recording') => void;
  onEdit?: (meeting: MeetingArtifact) => void;
  contactId?: string; // Add contact ID for suggestions
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  open,
  onClose,
  meeting,
  onUpdateActionItem,
  onApplySuggestion,
  onAddContent,
  onEdit,
  contactId,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    insights: true,
    content: false,
  });

  const meetingContent = meeting.content as MeetingArtifactContent;
  const insights = meetingContent.insights;
  const startTime = meetingContent.startTime ? new Date(meetingContent.startTime) : 
    meetingContent.meeting_date ? new Date(meetingContent.meeting_date) : new Date();
  const endTime = meetingContent.endTime ? new Date(meetingContent.endTime) : 
    meetingContent.meeting_date && meetingContent.duration_minutes ? 
      new Date(new Date(meetingContent.meeting_date).getTime() + meetingContent.duration_minutes * 60000) : 
      new Date();
  
  const duration = intervalToDuration({ start: startTime, end: endTime });
  const durationText = formatDuration(duration, { format: ['hours', 'minutes'] });

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getProcessingStatusDisplay = () => {
    if (!meeting.ai_parsing_status || meeting.ai_parsing_status === 'completed') return null;

    const statusConfig = {
      pending: { icon: HourglassEmptyIcon, color: 'info' as const, text: 'Queued for AI processing' },
      processing: { icon: HourglassEmptyIcon, color: 'warning' as const, text: 'AI processing in progress...' },
      failed: { icon: ErrorOutlineIcon, color: 'error' as const, text: 'AI processing failed' },
    };

    const config = statusConfig[meeting.ai_parsing_status];
    const StatusIcon = config.icon;

    return (
      <Alert 
        severity={config.color} 
        icon={<StatusIcon />}
        sx={{ mb: 2 }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">{config.text}</Typography>
          {meeting.ai_parsing_status === 'processing' && <LinearProgress sx={{ width: 100, ml: 1 }} />}
        </Box>
      </Alert>
    );
  };

  const getSentimentChip = (sentiment?: string) => {
    if (!sentiment) return null;
    
    const sentimentConfig = {
      positive: { color: 'success' as const, label: '😊 Positive' },
      neutral: { color: 'default' as const, label: '😐 Neutral' },
      negative: { color: 'error' as const, label: '😟 Negative' },
    };

    const config = sentimentConfig[sentiment as keyof typeof sentimentConfig];
    if (!config) return null;

    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        variant="outlined" 
      />
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '600px', maxHeight: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <Typography variant="h5" gutterBottom>
              {meetingContent.title || 'Meeting'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip 
                icon={<EventIcon />} 
                label={format(startTime, 'MMM d, yyyy • h:mm a')} 
                variant="outlined" 
                size="small"
              />
              {durationText && (
                <Chip 
                  label={durationText} 
                  variant="outlined" 
                  size="small"
                />
              )}
              {getSentimentChip(insights?.sentiment)}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {onEdit && (
              <IconButton onClick={() => onEdit(meeting)} size="small">
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {getProcessingStatusDisplay()}

        {/* AI Suggestions Section */}
        <Box sx={{ mb: 2 }}>
          <ArtifactSuggestions
            artifactId={meeting.id}
            artifactType="meeting"
            aiParsingStatus={meeting.ai_parsing_status as 'pending' | 'processing' | 'completed' | 'failed'}
            contactId={contactId}
            compact={false}
          />
        </Box>

        {/* Meeting Details */}
        <Accordion 
          expanded={expandedSections.details} 
          onChange={() => handleSectionToggle('details')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Meeting Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flex-direction="column" gap={2}>
              {/* Time and Location */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EventIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {format(startTime, 'EEEE, MMMM d, yyyy')} • {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </Typography>
                </Box>
                {meetingContent.location && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">{meetingContent.location}</Typography>
                  </Box>
                )}
              </Box>

              {/* Attendees */}
              {meetingContent.attendees && meetingContent.attendees.length > 0 && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">
                      Attendees ({meetingContent.attendees.length})
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                      {(meetingContent.attendees as MeetingAttendee[]).map((attendee: MeetingAttendee, index: number) => (
                        <Tooltip key={attendee.email || index} title={`${attendee.name || attendee.email}${attendee.isOrganizer ? ' (Organizer)' : ''}`}>
                          <Avatar alt={attendee.name || attendee.email}>
                            {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </Box>
                </Box>
              )}

              {/* External Links */}
              {(meetingContent.google_calendar_link || meetingContent.google_calendar_html_link) && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    External Links
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {meetingContent.google_calendar_html_link && (
                      <Button
                        size="small"
                        startIcon={<LinkIcon />}
                        href={meetingContent.google_calendar_html_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View in Google Calendar
                      </Button>
                    )}
                    {meetingContent.google_calendar_link && (
                      <Button
                        size="small"
                        startIcon={<LinkIcon />}
                        href={meetingContent.google_calendar_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Meeting
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* AI Insights */}
        {insights && (
          <Accordion 
            expanded={expandedSections.insights} 
            onChange={() => handleSectionToggle('insights')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <LightbulbOutlinedIcon />
                <Typography variant="h6">AI Insights</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Summary */}
                {insights.summary && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Summary
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{insights.summary}</Typography>
                    </Paper>
                  </Box>
                )}

                {/* Action Items */}
                {insights.actionItems && insights.actionItems.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagOutlinedIcon fontSize="small" />
                      Action Items ({insights.actionItems.length})
                    </Typography>
                    <List dense>
                      {(insights.actionItems as ActionItem[]).map((item: ActionItem) => (
                        <ListItem key={item.id || item.description} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                            <Checkbox
                              edge="start"
                              checked={!!item.completed}
                              icon={<RadioButtonUncheckedIcon />}
                              checkedIcon={<CheckCircleOutlineIcon />}
                              onChange={(e) => onUpdateActionItem?.(meeting.id, item.id || '', e.target.checked)}
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.description}
                            secondary={
                              <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                {item.assignee && (
                                  <Chip label={`Assigned: ${item.assignee}`} size="small" variant="outlined" />
                                )}
                                {item.dueDate && (
                                  <Chip 
                                    label={`Due: ${format(new Date(item.dueDate), 'MMM d')}`} 
                                    size="small" 
                                    variant="outlined" 
                                    color={new Date(item.dueDate) < new Date() ? 'error' : 'default'}
                                  />
                                )}
                                {item.priority && (
                                  <Chip 
                                    label={item.priority.toUpperCase()} 
                                    size="small" 
                                    variant="outlined"
                                    color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}
                                  />
                                )}
                              </Box>
                            }
                            primaryTypographyProps={{
                              sx: { 
                                textDecoration: item.completed ? 'line-through' : 'none',
                                color: item.completed ? 'text.disabled' : 'text.primary'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Key Topics */}
                {insights.keyTopics && insights.keyTopics.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Key Topics
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {insights.keyTopics.map((topic: string) => (
                        <Chip key={topic} label={topic} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Follow-up Suggestions */}
                {insights.followUpSuggestions && insights.followUpSuggestions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" />
                      Follow-up Suggestions
                    </Typography>
                    <List dense>
                      {insights.followUpSuggestions.map((suggestion: FollowUpSuggestion) => (
                        <ListItem key={suggestion.id || suggestion.description} sx={{ pl: 0 }}>
                          <ListItemText
                            primary={suggestion.description}
                            secondary={
                              <Box display="flex" gap={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <Chip 
                                  label={suggestion.type.toUpperCase()} 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {suggestion.reasoning}
                                </Typography>
                                {onApplySuggestion && (
                                  <Button
                                    size="small"
                                    onClick={() => onApplySuggestion(meeting.id, suggestion.id || '')}
                                    sx={{ ml: 'auto' }}
                                  >
                                    Apply
                                  </Button>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Next Steps */}
                {insights.nextSteps && insights.nextSteps.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Next Steps
                    </Typography>
                    <List dense>
                      {insights.nextSteps.map((step: string, index: number) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText primary={`${index + 1}. ${step}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Meeting Content */}
        <Accordion 
          expanded={expandedSections.content} 
          onChange={() => handleSectionToggle('content')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <NotesIcon />
              <Typography variant="h6">Meeting Content</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Notes */}
              {meetingContent.notes && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {meetingContent.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Transcript */}
              {meetingContent.transcript && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Transcript
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {meetingContent.transcript}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Recording */}
              {meetingContent.recording_url && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recording
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2">Recording available</Typography>
                      <Button size="small" href={meetingContent.recording_url} target="_blank">
                        Download
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Add Content Actions */}
              {onAddContent && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Add Content
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      size="small"
                      startIcon={<NotesIcon />}
                      onClick={() => onAddContent(meeting, 'notes')}
                      variant="outlined"
                    >
                      {meetingContent.notes ? 'Edit Notes' : 'Add Notes'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<RecordVoiceOverIcon />}
                      onClick={() => onAddContent(meeting, 'transcript')}
                      variant="outlined"
                    >
                      {meetingContent.transcript ? 'Edit Transcript' : 'Add Transcript'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => onAddContent(meeting, 'recording')}
                      variant="outlined"
                    >
                      {meetingContent.recording_url ? 'Replace Recording' : 'Upload Recording'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 