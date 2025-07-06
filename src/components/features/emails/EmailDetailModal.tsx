'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Avatar,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  PriorityHigh as PriorityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,

} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { EmailArtifact, EmailThread } from '@/types/email';
import { useEmailThread } from '@/lib/hooks/useEmailThread';
import { useParams } from 'next/navigation';
import { cleanEmailText } from '@/lib/utils/textDecoding';
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer';
import { ArtifactSuggestions } from '@/components/features/suggestions/ArtifactSuggestions';

interface EmailDetailModalProps {
  open: boolean;
  onClose: () => void;
  email: EmailArtifact | null;
  thread?: EmailThread | null;
  onDelete?: (email: EmailArtifact) => void;
  onArchive?: (email: EmailArtifact) => void;
  onToggleStar?: (email: EmailArtifact) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  open,
  onClose,
  email,
  thread,
  onDelete,
  onArchive,
  onToggleStar,
}) => {
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [showFullHeaders, setShowFullHeaders] = useState<Set<string>>(new Set());
  
  // Get contact ID from URL params
  const params = useParams();
  const contactId = params?.id as string;

  // Fetch full thread data if we have a thread_id
  const threadId = email?.metadata?.thread_id || email?.id;
  const { 
    data: fetchedThread, 
    isLoading: threadLoading,
    error: threadError 
  } = useEmailThread({ 
    threadId, 
    contactId,
    enabled: open && !!email && !!contactId
  });

  // Use provided thread, fetched thread, or create single-email thread as fallback
  const emailThread = thread || fetchedThread || (email ? {
    thread_id: email.metadata?.thread_id || email.id,
    subject: email.metadata?.subject || 'No Subject',
    participants: email.metadata?.from ? [email.metadata.from] : [],
    message_count: 1,
    unread_count: email.metadata?.is_read === false ? 1 : 0,
    has_starred: email.metadata?.is_starred || false,
    has_attachments: email.metadata?.has_attachments || false,
    latest_date: email.timestamp || email.created_at,
    earliest_date: email.timestamp || email.created_at,
    labels: email.metadata?.labels || [],
    messages: [email],
    direction: 'received' as const,
    sent_count: 0,
    received_count: 1,
    importance: 'normal' as const,
  } : null);

  if (!email || !email.metadata || !emailThread) {
    return null;
  }

  // DEBUG: Log raw email data to console for analysis
  console.log('🔍 DEBUG: Raw email artifact data:', {
    email,
    metadata: email.metadata,
    content: email.content,
    bodyText: email.metadata?.body_text,
    bodyHtml: email.metadata?.body_html,
    snippet: email.metadata?.snippet
  });

  const toggleEmailExpansion = (emailId: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  const toggleFullHeaders = (emailId: string) => {
    const newShowHeaders = new Set(showFullHeaders);
    if (newShowHeaders.has(emailId)) {
      newShowHeaders.delete(emailId);
    } else {
      newShowHeaders.add(emailId);
    }
    setShowFullHeaders(newShowHeaders);
  };

  // Helper functions
  const getEmailDirection = (emailArtifact: EmailArtifact): 'sent' | 'received' => {
    const labels = emailArtifact.metadata?.labels || [];
    const fromEmail = emailArtifact.metadata?.from?.email?.toLowerCase() || '';
    
    if (labels.includes('SENT')) return 'sent';
    if (labels.includes('INBOX')) return 'received';
    
    if (fromEmail.includes('hfinkelstein@gmail.com') || fromEmail.includes('henry@')) {
      return 'sent';
    }
    
    return 'received';
  };

  const getEmailImportance = (emailArtifact: EmailArtifact): 'high' | 'normal' | 'low' => {
    const labels = emailArtifact.metadata?.labels || [];
    
    if (labels.includes('IMPORTANT') || labels.includes('CATEGORY_PRIMARY')) {
      return 'high';
    }
    
    if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_UPDATES')) {
      return 'low';
    }
    
    return 'normal';
  };

  const formatParticipants = (participants: Array<{ email: string; name?: string }> | undefined) => {
    if (!participants) return '';
    return participants.map(p => p.name ? `${p.name} <${p.email}>` : p.email).join(', ');
  };

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Get the best content format for display (HTML or text)
  const getEmailContentInfo = (emailArtifact: EmailArtifact) => {
    const plainText = emailArtifact.metadata?.body_text;
    const htmlText = emailArtifact.metadata?.body_html;
    
    // If we have both, prefer HTML if it's significantly longer (better formatting)
    if (plainText && htmlText) {
      const textLength = plainText.length;
      const htmlLength = htmlText.length;
      
      // Use HTML if it's more than 3x longer (indicates rich formatting)
      if (htmlLength > textLength * 3) {
        return { type: 'html' as const, content: htmlText };
      } else {
        // Otherwise prefer plain text for simplicity
        return { type: 'text' as const, content: cleanEmailText(plainText) };
      }
    }
    
    // Prefer HTML if only HTML is available
    if (htmlText) {
      return { type: 'html' as const, content: htmlText };
    }
    
    // Fall back to plain text
    if (plainText) {
      return { type: 'text' as const, content: cleanEmailText(plainText) };
    }
    
    // Last resort - use the content field
    return { 
      type: 'text' as const, 
      content: cleanEmailText(emailArtifact.content || 'No content available') 
    };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  const getThreadImportance = (): 'high' | 'normal' | 'low' => {
    const hasImportant = emailThread.messages.some(msg => getEmailImportance(msg) === 'high');
    return hasImportant ? 'high' : 'normal';
  };

  // Filter messages to display (all messages in the thread)
  const messagesToDisplay = emailThread.messages.slice().sort((a, b) => 
    new Date(a.timestamp || a.created_at).getTime() - new Date(b.timestamp || b.created_at).getTime()
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {emailThread.subject}
          </Typography>
          {getThreadImportance() === 'high' && (
            <Tooltip title="Important">
              <PriorityIcon sx={{ color: 'warning.main', fontSize: '20px' }} />
            </Tooltip>
          )}
          {emailThread.has_attachments && (
            <Tooltip title="Has attachments">
              <AttachFileIcon sx={{ color: 'text.secondary', fontSize: '20px' }} />
            </Tooltip>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Thread info */}
          <Chip
            label={`${emailThread.message_count} message${emailThread.message_count > 1 ? 's' : ''}`}
            size="small"
            sx={{
              backgroundColor: '#f5f5f5',
              color: 'text.secondary',
              fontSize: '12px',
              height: '24px',
            }}
          />
          
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {threadLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <Typography>Loading thread...</Typography>
          </Box>
        ) : threadError ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <Typography color="error">Error loading thread: {threadError.message}</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {messagesToDisplay.map((emailMessage, index) => {
            const isExpanded = expandedEmails.has(emailMessage.id);
            const showHeaders = showFullHeaders.has(emailMessage.id);
            const direction = getEmailDirection(emailMessage);
            const isStarred = emailMessage.metadata?.is_starred;
            const hasAttachments = emailMessage.metadata?.has_attachments;

            return (
              <Box key={emailMessage.id} sx={{ borderBottom: index < messagesToDisplay.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                {/* Email Header */}
                <Box 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    backgroundColor: isExpanded ? 'transparent' : '#fafafa'
                  }}
                  onClick={() => !isExpanded && toggleEmailExpansion(emailMessage.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                      {getInitials(emailMessage.metadata?.from?.name, emailMessage.metadata?.from?.email || '')}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {emailMessage.metadata?.from?.name || emailMessage.metadata?.from?.email || 'Unknown Sender'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(emailMessage.timestamp || emailMessage.created_at)}
                          </Typography>
                          
                          {/* Direction indicator */}
                          <Chip
                            icon={direction === 'sent' ? <SendIcon style={{ fontSize: '12px' }} /> : <InboxIcon style={{ fontSize: '12px' }} />}
                            label={direction === 'sent' ? 'Sent' : 'Received'}
                            size="small"
                            sx={{
                              backgroundColor: direction === 'sent' ? '#e8f5e8' : '#e3f2fd',
                              color: direction === 'sent' ? '#2e7d32' : '#1976d2',
                              fontSize: '10px',
                              height: '20px',
                              fontWeight: 600
                            }}
                          />
                          
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStar?.(emailMessage);
                            }}
                            sx={{ color: isStarred ? 'warning.main' : 'text.secondary' }}
                          >
                            {isStarred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                          
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEmailExpansion(emailMessage.id);
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {!isExpanded && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          mt: 0.5
                        }}>
                          {(() => {
                            const contentInfo = getEmailContentInfo(emailMessage);
                            const preview = contentInfo.type === 'html' 
                              ? contentInfo.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                              : contentInfo.content;
                            return preview.substring(0, 120) + '...';
                          })()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Expanded Email Content */}
                <Collapse in={isExpanded}>
                  <Box sx={{ px: 2, pb: 2 }}>
                    {/* AI Processing Status & Suggestions */}
                    <ArtifactSuggestions 
                      artifactId={emailMessage.id}
                      artifactType="email"
                      aiParsingStatus={emailMessage.ai_parsing_status || undefined}
                      contactId={contactId}
                    />
                    
                    {/* Full Email Headers */}
                    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }} elevation={0}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          <strong>From:</strong> {emailMessage.metadata?.from?.name || emailMessage.metadata?.from?.email || 'Unknown'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>To:</strong> {formatParticipants(emailMessage.metadata?.to)}
                        </Typography>
                        
                        {emailMessage.metadata?.cc && emailMessage.metadata.cc.length > 0 && (
                          <Typography variant="body2">
                            <strong>Cc:</strong> {formatParticipants(emailMessage.metadata.cc)}
                          </Typography>
                        )}
                        
                        {showHeaders && (
                          <>
                            <Typography variant="body2">
                              <strong>Date:</strong> {formatDate(emailMessage.timestamp || emailMessage.created_at)}
                            </Typography>
                          </>
                        )}
                        
                        <Button 
                          size="small" 
                          onClick={() => toggleFullHeaders(emailMessage.id)}
                          sx={{ alignSelf: 'flex-start', mt: 1, p: 0, minWidth: 'auto', textTransform: 'none' }}
                        >
                          {showHeaders ? 'Hide details' : 'Show details'}
                        </Button>
                      </Stack>
                    </Paper>

                    {/* Email Content */}
                    {(() => {
                      const contentInfo = getEmailContentInfo(emailMessage);
                      return contentInfo.type === 'html' ? (
                        <Box sx={{ mb: 2 }}>
                          <SafeHtmlRenderer html={contentInfo.content} />
                        </Box>
                      ) : (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            mb: 2
                          }}
                        >
                          {contentInfo.content}
                        </Typography>
                      );
                    })()}
                    
                    {/* Attachments placeholder */}
                    {hasAttachments && (
                      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachFileIcon sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            This email has attachments (attachment viewing not yet implemented)
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Email actions removed - users can use "View in Gmail" link for any email management */}
                  </Box>
                </Collapse>
              </Box>
            );
                      })}
          </Box>
        )}
      </DialogContent>

      {/* Thread Action Buttons */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Thread-level actions are shown here */}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onArchive && (
              <IconButton 
                onClick={() => onArchive(email)}
                size="small"
                title="Archive Thread"
              >
                <ArchiveIcon />
              </IconButton>
            )}
            
            {onDelete && (
              <IconButton 
                onClick={() => onDelete(email)}
                size="small"
                title="Delete Thread"
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            )}
            
            <IconButton size="small" title="Print">
              <PrintIcon />
            </IconButton>
            
            <IconButton size="small" title="More options">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}; 