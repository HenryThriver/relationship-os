'use client';

import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Paper,
  Stack,
  Avatar,
  Divider,
  Link as MuiLink,
  Fade,
} from '@mui/material';
import {
  Close,
  LinkedIn,
  ThumbUp,
  Comment,
  Share,
  OpenInNew,
  Person,
  Business,
} from '@mui/icons-material';
import type { LinkedInPostArtifact } from '@/types/artifact';

interface LinkedInPostModalProps {
  open: boolean;
  onClose: () => void;
  artifact: LinkedInPostArtifact;
  contactName?: string;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95vw', sm: '80vw', md: '70vw', lg: '60vw' },
  maxWidth: 700,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle = {
  p: 3,
  borderBottom: '1px solid',
  borderColor: 'divider',
  bgcolor: '#f8f9fa',
};

const contentStyle = {
  p: 3,
  flexGrow: 1,
  overflow: 'auto',
};

export const LinkedInPostModal: React.FC<LinkedInPostModalProps> = ({
  open,
  onClose,
  artifact,
  contactName,
}) => {
  if (!artifact?.metadata) return null;

  const post = artifact.metadata;
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getPostTypeDisplay = (type: string) => {
    switch (type) {
      case 'reshare':
        return 'Reshared';
      case 'article':
        return 'Article';
      case 'original':
      default:
        return 'Post';
    }
  };

  const getRelevanceBadge = () => {
    if (post.is_author) {
      return <Chip label="Author" color="primary" size="small" />;
    }
    
    switch (post.relevance_reason) {
      case 'mentioned_contact':
        return <Chip label="Mentioned" color="secondary" size="small" />;
      case 'engaged_with_contact':
        return <Chip label="Engaged" color="info" size="small" />;
      default:
        return <Chip label="Relevant" color="default" size="small" />;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      aria-labelledby="linkedin-post-modal-title"
    >
      <Fade in={open}>
        <Paper sx={modalStyle}>
          {/* Header */}
          <Box sx={headerStyle}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" alignItems="center" gap={2}>
                <LinkedIn sx={{ color: '#0077B5', fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" id="linkedin-post-modal-title">
                    LinkedIn {getPostTypeDisplay(post.post_type)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    {getRelevanceBadge()}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.posted_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={contentStyle}>
            {/* Author Info */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ bgcolor: '#0077B5' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {post.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {post.post_type === 'article' ? 'Published an article' : 'Shared a post'}
                </Typography>
              </Box>
            </Box>

            {/* Post Content */}
            <Box mb={3}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {post.content}
              </Typography>
            </Box>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Hashtags:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {post.hashtags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag.startsWith('#') ? tag : `#${tag}`}
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Mentions */}
            {post.mentions && post.mentions.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Mentions:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {post.mentions.map((mention, index) => (
                    <Chip 
                      key={index} 
                      label={mention.startsWith('@') ? mention : `@${mention}`}
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Media */}
            {post.media && post.media.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Attachments:
                </Typography>
                <Stack spacing={1}>
                  {post.media.map((media, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Business color="action" />
                        <Box flexGrow={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {media.title || `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} Content`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {media.type.toUpperCase()}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<OpenInNew />}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Engagement Metrics */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" mb={2}>
                Engagement:
              </Typography>
              <Stack direction="row" spacing={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ThumbUp fontSize="small" color="primary" />
                  <Typography variant="body2" fontWeight="medium">
                    {post.engagement.likes.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    likes
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Comment fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="medium">
                    {post.engagement.comments.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    comments
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Share fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="medium">
                    {post.engagement.shares.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    shares
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* AI Analysis */}
            {(post.content_topics || post.sentiment || post.business_relevance) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    AI Analysis:
                  </Typography>
                  <Stack spacing={2}>
                    {post.content_topics && post.content_topics.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Topics:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {post.content_topics.map((topic, index) => (
                            <Chip 
                              key={index} 
                              label={topic}
                              size="small" 
                              color="info"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {post.sentiment && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                          Sentiment:
                        </Typography>
                        <Chip 
                          label={post.sentiment} 
                          size="small"
                          color={
                            post.sentiment === 'positive' ? 'success' :
                            post.sentiment === 'negative' ? 'error' : 'default'
                          }
                        />
                      </Box>
                    )}
                    {post.business_relevance && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" color="text.secondary">
                          Business Relevance:
                        </Typography>
                        <Chip 
                          label={post.business_relevance} 
                          size="small"
                          color={
                            post.business_relevance === 'high' ? 'error' :
                            post.business_relevance === 'medium' ? 'warning' : 'default'
                          }
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {/* Actions */}
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<OpenInNew />}
                href={post.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#0077B5', borderColor: '#0077B5' }}
              >
                View on LinkedIn
              </Button>
            </Box>

            {/* Metadata */}
            <Box mt={3} pt={2} borderTop="1px solid" borderColor="divider">
              <Typography variant="caption" color="text.secondary">
                Last synced: {formatDate(post.last_synced_at)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
}; 