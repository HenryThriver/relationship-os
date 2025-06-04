'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Badge,
  Tooltip,
  Button,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  AttachFile as AttachIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { EmailArtifact, EmailThread } from '@/types/email';
import type { BaseArtifact } from '@/types/artifact';

export interface EmailTimelineItemProps {
  artifacts: EmailArtifact[];
  onEmailClick?: (artifact: EmailArtifact) => void;
  onThreadClick?: (thread: EmailThread) => void;
  className?: string;
}

interface GroupedEmails {
  [threadId: string]: EmailArtifact[];
}

export const EmailTimelineItem: React.FC<EmailTimelineItemProps> = ({
  artifacts,
  onEmailClick,
  onThreadClick,
  className,
}) => {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Group emails by thread_id
  const groupedEmails = useMemo((): GroupedEmails => {
    return artifacts.reduce((groups: GroupedEmails, artifact) => {
      const threadId = artifact.metadata?.thread_id || artifact.id;
      if (!groups[threadId]) {
        groups[threadId] = [];
      }
      groups[threadId].push(artifact);
      return groups;
    }, {});
  }, [artifacts]);

  // Convert grouped emails to EmailThread objects for display
  const emailThreads = useMemo((): EmailThread[] => {
    return Object.entries(groupedEmails).map(([threadId, emails]) => {
      // Sort emails by date within thread
      const sortedEmails = [...emails].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const latestEmail = sortedEmails[sortedEmails.length - 1];
      const earliestEmail = sortedEmails[0];

      // Extract unique participants
      const participants = new Map<string, { email: string; name?: string }>();
      
      sortedEmails.forEach(email => {
        if (email.metadata?.from) {
          participants.set(email.metadata.from.email, email.metadata.from);
        }
        email.metadata?.to?.forEach(p => participants.set(p.email, p));
        email.metadata?.cc?.forEach(p => participants.set(p.email, p));
      });

      // Combine all labels
      const allLabels = [...new Set(sortedEmails.flatMap(e => e.metadata?.labels || []))];

      return {
        thread_id: threadId,
        subject: latestEmail.metadata?.subject || 'No Subject',
        participants: Array.from(participants.values()),
        message_count: sortedEmails.length,
        unread_count: sortedEmails.filter(e => e.metadata?.is_read === false).length,
        has_starred: sortedEmails.some(e => e.metadata?.is_starred),
        has_attachments: sortedEmails.some(e => e.metadata?.has_attachments),
        latest_date: latestEmail.timestamp,
        earliest_date: earliestEmail.timestamp,
        labels: allLabels,
        messages: sortedEmails,
      };
    });
  }, [groupedEmails]);

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleEmailClick = (artifact: EmailArtifact, thread: EmailThread) => {
    if (onEmailClick) {
      onEmailClick(artifact);
    } else if (onThreadClick) {
      onThreadClick(thread);
    }
  };

  const formatParticipants = (participants: Array<{ email: string; name?: string }>, maxDisplay = 3) => {
    const displayParticipants = participants.slice(0, maxDisplay);
    const remaining = participants.length - maxDisplay;
    
    const names = displayParticipants.map(p => p.name || p.email.split('@')[0]).join(', ');
    return remaining > 0 ? `${names} +${remaining}` : names;
  };

  if (emailThreads.length === 0) {
    return null;
  }

  return (
    <Box className={className}>
      {emailThreads.map((thread) => {
        const isExpanded = expandedThreads.has(thread.thread_id);
        const isThread = thread.message_count > 1;
        const latestMessage = thread.messages[thread.messages.length - 1];

        return (
          <Card 
            key={thread.thread_id} 
            sx={{ 
              mb: 2, 
              border: thread.unread_count > 0 ? '2px solid' : '1px solid',
              borderColor: thread.unread_count > 0 ? 'primary.main' : 'divider',
              '&:hover': { boxShadow: 2 },
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              {/* Thread Header */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmailIcon color="primary" fontSize="small" />
                
                {/* Unread indicator */}
                {thread.unread_count > 0 && (
                  <Badge
                    badgeContent={thread.unread_count}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <Box width={8} height={8} bgcolor="primary.main" borderRadius="50%" />
                  </Badge>
                )}

                {/* Star indicator */}
                {thread.has_starred && (
                  <StarIcon color="warning" fontSize="small" />
                )}

                {/* Attachment indicator */}
                {thread.has_attachments && (
                  <AttachIcon color="action" fontSize="small" />
                )}

                {/* Thread count badge */}
                {isThread && (
                  <Chip 
                    label={`${thread.message_count} emails`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}

                <Box flexGrow={1} />

                {/* Timestamp */}
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(parseISO(thread.latest_date), { addSuffix: true })}
                </Typography>

                {/* Expand/Collapse button for threads */}
                {isThread && (
                  <IconButton
                    size="small"
                    onClick={() => toggleThread(thread.thread_id)}
                    aria-label={isExpanded ? 'Collapse thread' : 'Expand thread'}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>

              {/* Subject and Participants */}
              <Box mb={1}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: thread.unread_count > 0 ? 600 : 400,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' },
                  }}
                  onClick={() => handleEmailClick(latestMessage, thread)}
                >
                  {thread.subject}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {formatParticipants(thread.participants)}
                </Typography>
              </Box>

              {/* Latest message preview (when collapsed) */}
              {!isExpanded && (
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {latestMessage.metadata?.snippet || latestMessage.content}
                  </Typography>
                </Box>
              )}

              {/* Gmail labels */}
              {thread.labels.length > 0 && (
                <Box mt={1}>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {thread.labels.slice(0, 3).map((label) => (
                      <Chip
                        key={label}
                        label={label.replace('CATEGORY_', '').replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 20 }}
                      />
                    ))}
                    {thread.labels.length > 3 && (
                      <Chip
                        label={`+${thread.labels.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 20 }}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Expanded thread view */}
              <Collapse in={isExpanded}>
                <Box mt={2}>
                  {thread.messages.map((email, index) => (
                    <Card 
                      key={email.id}
                      variant="outlined"
                      sx={{ 
                        mb: 1,
                        ml: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: email.metadata?.is_read === false ? 'action.selected' : 'background.paper',
                      }}
                      onClick={() => handleEmailClick(email, thread)}
                    >
                      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          {/* Position in thread */}
                          <Typography variant="caption" color="primary">
                            #{index + 1}
                          </Typography>

                          {/* From */}
                          <Typography variant="body2" fontWeight={500}>
                            {email.metadata?.from?.name || email.metadata?.from?.email}
                          </Typography>

                          {/* Status indicators */}
                          {email.metadata?.is_read === false && (
                            <Box width={6} height={6} bgcolor="primary.main" borderRadius="50%" />
                          )}

                          {email.metadata?.is_starred && (
                            <StarIcon color="warning" fontSize="small" />
                          )}

                          {email.metadata?.has_attachments && (
                            <AttachIcon color="action" fontSize="small" />
                          )}

                          <Box flexGrow={1} />

                          {/* Timestamp */}
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(parseISO(email.timestamp), { addSuffix: true })}
                          </Typography>
                        </Box>

                        {/* Email snippet */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {email.metadata?.snippet || email.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Collapse>

              {/* Actions */}
              <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                <Tooltip title="View Full Thread">
                  <Button
                    size="small"
                    startIcon={<EmailIcon />}
                    onClick={() => handleEmailClick(latestMessage, thread)}
                  >
                    View
                  </Button>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default EmailTimelineItem; 