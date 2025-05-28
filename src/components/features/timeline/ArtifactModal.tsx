'use client';

import React, { useState } from 'react';
import {
  Modal, Box, Typography, IconButton, Paper, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableRow,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  Source as SourceIcon,
} from '@mui/icons-material';

import { getArtifactConfig } from '@/config/artifactConfig';
import type { ArtifactGlobal, LinkedInArtifact, VoiceMemoArtifact, LoopArtifact, LoopStatus, LoopArtifactContent } from '@/types';
import { format, parseISO } from 'date-fns';
import { UpdateSuggestionRecord } from '@/types/suggestions';
import { formatFieldPathForDisplay } from '@/lib/utils/formatting';
import { LinkedInProfileModal } from '@/components/features/linkedin/LinkedInProfileModal';
import { EnhancedLoopModal } from '../loops/EnhancedLoopModal';

interface ArtifactModalProps {
  artifact: ArtifactGlobal | null;
  open: boolean;
  onClose: () => void;
  contactId?: string;
  contactName?: string;
  contactLinkedInUrl?: string;
  relatedSuggestions?: UpdateSuggestionRecord[];
  contactFieldSources?: Record<string, string>;
  onDelete?: (artifactId: string) => Promise<void>;
  onReprocess?: (artifactId: string) => Promise<void>;
  onPlayAudio?: (audioPath: string) => Promise<string>;
  isLoading?: boolean;
  isDeleting?: boolean;
  isReprocessing?: boolean;
  error?: string | null;
  onLoopStatusUpdate?: (loopId: string, newStatus: LoopStatus) => Promise<void>;
  onLoopEdit?: (loopId: string, updates: Partial<LoopArtifactContent>) => Promise<void>;
  onLoopDelete?: (loopId: string) => Promise<void>;
  onLoopShare?: (loopId: string) => Promise<void>;
  onLoopComplete?: (loopId: string, outcome: any) => Promise<void>;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '70%', md: '50%' },
  maxWidth: '600px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 3,
  borderRadius: '8px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
};

const contentStyle = {
  overflowY: 'auto',
  pr: 1,
  mr: -1,
  flexGrow: 1,
};

const renderContent = (content: any, level = 0): React.ReactNode => {
  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
    return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{String(content)}</Typography>;
  }
  if (Array.isArray(content)) {
    return (
      <Box component="ul" sx={{ pl: level > 0 ? 2 : 0, listStyleType: 'disc', my: 0.5 }}>
        {content.map((item, index) => (
          <li key={index}>{renderContent(item, level + 1)}</li>
        ))}
      </Box>
    );
  }
  if (typeof content === 'object' && content !== null) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ my: 1, border: '1px solid', borderColor: 'divider'}}>
        <Table size="small">
          <TableBody>
            {Object.entries(content).map(([key, value]) => (
              <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium', width: '30%', verticalAlign: 'top' }}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>{renderContent(value, level + 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  return <Typography variant="body2" color="text.secondary">N/A</Typography>;
};

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  artifact,
  open,
  onClose,
  contactId,
  contactName,
  contactLinkedInUrl,
  relatedSuggestions,
  contactFieldSources,
  onDelete,
  onReprocess,
  onPlayAudio,
  isLoading,
  isDeleting,
  isReprocessing,
  error,
  onLoopStatusUpdate,
  onLoopEdit,
  onLoopDelete,
  onLoopShare,
  onLoopComplete,
}) => {
  if (!artifact) return null;

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handlePlayAudioInternal = async () => {
    if (!artifact || artifact.type !== 'voice_memo' || !onPlayAudio) return;
    const voiceMemo = artifact as VoiceMemoArtifact;
    if (!voiceMemo.audio_file_path) return;
    setAudioError(null);
    try {
      const url = await onPlayAudio(voiceMemo.audio_file_path);
      setAudioUrl(url);
    } catch (err: any) {
      setAudioError(err.message || 'Failed to play audio');
    }
  };

  const handleDeleteInternal = () => {
    if (!onDelete || !artifact) return;
    if (window.confirm('Are you sure you want to delete this artifact? This action cannot be undone.')) {
      onDelete(artifact.id).catch(err => console.error("Delete failed from modal", err));
    }
  };

  const handleReprocessInternal = () => {
    if (!onReprocess || !artifact) return;
    if (window.confirm('This will re-run AI analysis on this artifact. Continue?')) {
      onReprocess(artifact.id).catch(err => console.error("Reprocess failed from modal", err));
    }
  };

  const config = getArtifactConfig(artifact.type);
  const { icon: Icon, badgeLabel, color } = config;
  const detailContentToRender = artifact.metadata ? artifact.metadata : (artifact.content || "No details available");

  if (artifact.type === 'linkedin_profile') {
    return (
      <LinkedInProfileModal 
        open={open} 
        onClose={onClose} 
        artifact={artifact as LinkedInArtifact} 
        contactId={contactId}
        contactName={contactName}
        contactLinkedInUrl={contactLinkedInUrl}
      />
    );
  }

  if (artifact.type === 'loop') {
    return (
      <EnhancedLoopModal
        open={open}
        onClose={onClose}
        artifact={artifact as LoopArtifact}
        contactName={contactName || 'Contact'}
        onStatusUpdate={onLoopStatusUpdate || (async () => console.warn('onLoopStatusUpdate not provided'))}
        onEdit={onLoopEdit || (async () => console.warn('onLoopEdit not provided'))}
        onDelete={onLoopDelete || (async () => console.warn('onLoopDelete not provided'))}
        onShare={onLoopShare || (async () => console.warn('onLoopShare not provided'))}
        onComplete={onLoopComplete || (async () => console.warn('onLoopComplete not provided'))}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="artifact-detail-title">
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexShrink: 0 }}>
          {Icon && <Icon sx={{ mr: 1.5, color: color || 'inherit', fontSize: '2rem' }} />}
          <Typography id="artifact-detail-title" variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {badgeLabel || artifact.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Typography>
          <IconButton onClick={onClose} aria-label="close artifact detail">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{mb:2, flexShrink: 0}} />

        <Box sx={contentStyle}>
          {error && !isDeleting && !isReprocessing && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            {artifact.type !== 'voice_memo' && (
              <Chip label={artifact.type} size="small" sx={{ backgroundColor: color, color: color ? 'white' : 'inherit' }} />
            )}
            {artifact.type === 'voice_memo' && (artifact as VoiceMemoArtifact).audio_file_path && onPlayAudio && (
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={handlePlayAudioInternal}
                disabled={isLoading}
                size="small"
              >
                Play Audio
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              {artifact.timestamp ? format(parseISO(artifact.timestamp), 'PPP p') : 'Date/Time unknown'}
            </Typography>
          </Box>

          {artifact.type !== 'voice_memo' && renderContent(detailContentToRender)}

          {artifact?.type === 'voice_memo' && (
            <Box sx={{ mt: artifact.type !== 'voice_memo' ? 2 : 0 }}>
              {(artifact as VoiceMemoArtifact).audio_file_path && onPlayAudio && (
                <Box sx={{ mb: 2, mt: 1 }}>
                  {audioUrl && (
                    <audio controls src={audioUrl} style={{ width: '100%', marginTop: '8px' }}>
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {audioError && <Alert severity="error" sx={{mt:1}}>{audioError}</Alert>}
                </Box>
              )}
              {(artifact as VoiceMemoArtifact).transcription && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>Transcription</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {(artifact as VoiceMemoArtifact).transcription}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {relatedSuggestions && relatedSuggestions.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon fontSize="small" /> AI-Generated Suggestions
                </Typography>
                <List dense>
                  {relatedSuggestions.map((suggestion) => {
                    const getSubSuggestionStatus = (
                      overallStatus: UpdateSuggestionRecord['status'],
                      userSelections: UpdateSuggestionRecord['user_selections'],
                      subFieldPath: string
                    ): 'approved' | 'rejected' | 'pending' | 'skipped' | 'not-selected' | 'mixed' => {
                      if (overallStatus === 'approved') return 'approved';
                      if (overallStatus === 'rejected') return 'rejected';
                      if (overallStatus === 'pending') return 'pending';
                      if (overallStatus === 'skipped') return 'skipped';
                      if (overallStatus === 'partial') {
                        if (userSelections && userSelections.hasOwnProperty(subFieldPath)) {
                            return userSelections[subFieldPath] ? 'approved' : 'rejected';
                        }
                        return 'not-selected'; 
                      }
                      return 'pending';
                    };
                    return (
                      <ListItem key={suggestion.id} divider sx={{ alignItems: 'flex-start'}}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                {suggestion.field_paths.map(fp => formatFieldPathForDisplay(fp)).join(', ')}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{component: 'div'}} 
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" gutterBottom>
                                Created: {new Date(suggestion.created_at).toLocaleDateString()}
                                {suggestion.status !== 'pending' && ` - Overall: ${suggestion.status}`}
                              </Typography>
                              {suggestion.suggested_updates.suggestions.map((s_update, index) => {
                                const individualStatus = getSubSuggestionStatus(suggestion.status, suggestion.user_selections, s_update.field_path);
                                return (
                                  <Paper key={index} variant="outlined" sx={{p: 1, my: 0.5, bgcolor: 'grey.50'}}>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5}}>
                                      <Typography variant="caption" display="block" sx={{fontWeight:'bold'}}>
                                        Field: {formatFieldPathForDisplay(s_update.field_path)}
                                      </Typography>
                                      <Chip 
                                        label={individualStatus} 
                                        size="small" 
                                        color={
                                          individualStatus === 'approved' ? 'success' :
                                          individualStatus === 'rejected' ? 'error' :
                                          individualStatus === 'not-selected' ? 'warning' : 'default'
                                        }
                                      />
                                    </Box>
                                    <Typography variant="caption" display="block">Action: {s_update.action}</Typography>
                                    {s_update.action !== 'add' && s_update.current_value !== undefined && (
                                      <Typography variant="caption" display="block">Current: {String(s_update.current_value)}</Typography>
                                    )}
                                    <Typography variant="caption" display="block">
                                      Suggested: {typeof s_update.suggested_value === 'object' ? renderContent(s_update.suggested_value) : String(s_update.suggested_value)}
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{color: 'text.secondary'}}>
                                      Confidence: {s_update.confidence.toFixed(2)} - {s_update.reasoning}
                                    </Typography>
                                  </Paper>
                                );
                              })}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </>
          )}

          {contactFieldSources && Object.keys(contactFieldSources).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SourceIcon fontSize="small" /> Contact Profile Updates
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This artifact is the source for the following contact profile fields:
                </Typography>
                <List dense>
                  {Object.entries(contactFieldSources).map(([fieldPath, value]) => (
                     <ListItem key={fieldPath} sx={{py:0.5, alignItems: 'flex-start'}}>
                       <ListItemText 
                         primary={<Typography variant="caption" sx={{fontWeight: 'medium'}}>{formatFieldPathForDisplay(fieldPath)}:</Typography>}
                         secondaryTypographyProps={{component: 'div'}} 
                         secondary={value === 'Value not directly found' || value === 'Suggested value not found in matched suggestion' || (typeof value ==='string' && value.startsWith('Value for sub-path')) ? <Typography variant="body2" color="text.secondary"><em>{value}</em></Typography> : renderContent(value)}
                       />
                     </ListItem>
                  ))}
                </List>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
          {onReprocess && artifact?.type === 'voice_memo' && (artifact as VoiceMemoArtifact).transcription_status === 'completed' && (
            <Tooltip title="Re-run AI analysis">
              <Button
                startIcon={isReprocessing ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={handleReprocessInternal}
                disabled={isLoading || isDeleting || isReprocessing}
                color="secondary"
                size="small"
              >
                {isReprocessing ? 'Reprocessing...' : 'Reprocess'}
              </Button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete artifact">
              <Button
                startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                onClick={handleDeleteInternal}
                disabled={isLoading || isDeleting || isReprocessing}
                color="error"
                size="small"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Tooltip>
          )}
          <Button onClick={onClose} disabled={isDeleting || isReprocessing}>Close</Button>
        </Box>
      </Box>
    </Modal>
  );
}; 