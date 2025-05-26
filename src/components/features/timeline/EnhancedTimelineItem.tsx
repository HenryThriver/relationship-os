'use client';

import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { 
  Mic as MicIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import type { ArtifactGlobal } from '@/types';

const ARTIFACT_CONFIG = {
  voice_memo: {
    icon: MicIcon,
    color: '#2196f3',
    bgColor: '#e3f2fd',
    label: 'Voice Memo'
  },
  linkedin_profile: {
    icon: LinkedInIcon,
    color: '#0077b5',
    bgColor: '#e3f4fd',
    label: 'LinkedIn'
  },
  email: {
    icon: EmailIcon,
    color: '#ea4335',
    bgColor: '#ffebee',
    label: 'Email'
  },
  meeting: {
    icon: EventIcon,
    color: '#4caf50',
    bgColor: '#e8f5e8',
    label: 'Meeting'
  },
  note: {
    icon: NoteIcon,
    color: '#ff9800',
    bgColor: '#fff3e0',
    label: 'Note'
  }
};

interface EnhancedTimelineItemProps {
  artifact: ArtifactGlobal;
  position: 'left' | 'right';
  onClick: (artifact: ArtifactGlobal) => void;
}

// Helper functions for responsive styles as per plan
const getItemStyles = (position: 'left' | 'right') => ({
  display: 'flex',
  justifyContent: { 
    xs: 'flex-start', // All items left-aligned on mobile (content to the right of the line)
    md: position === 'left' ? 'flex-end' : 'flex-start' 
  },
  mb: 4,
  position: 'relative',
  // For mobile, the line is at left: 30px. Items need to be clear of this.
  // The connector line and dot will also need adjustment for mobile.
  pl: { xs: '50px', md: 0 }, // Push content to the right of the mobile timeline line
});

const getCardStyles = (configColor: string, position: 'left' | 'right') => ({
  width: { xs: 'calc(100% - 20px)', md: '44%' }, // Adjusted width for mobile to use more space
  // marginLeft/Right for mobile will be handled by the getItemStyles pl and dot/connector positioning
  p: 2.5,
  cursor: 'pointer',
  border: `2px solid ${configColor}20`,
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    borderColor: `${configColor}40`
  },
  position: 'relative', // Ensure card is a positioning context if needed
  zIndex: 5, // Ensure card is above the main timeline line but below the dot
});

export const EnhancedTimelineItem: React.FC<EnhancedTimelineItemProps> = ({
  artifact,
  position,
  onClick
}) => {
  const config = ARTIFACT_CONFIG[artifact.type as keyof typeof ARTIFACT_CONFIG] || ARTIFACT_CONFIG.note;
  const Icon = config.icon;
  
  const timeString = new Date(artifact.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const getPreviewContent = () => {
    if (artifact.type === 'voice_memo' && (artifact as any).transcription) {
      return (artifact as any).transcription;
    }
    if (artifact.metadata && typeof artifact.metadata === 'object') {
      const commonFields = ['summary', 'title', 'description', 'subject', 'text', 'details'];
      for (const field of commonFields) {
        if ((artifact.metadata as Record<string, any>)[field]) {
          return String((artifact.metadata as Record<string, any>)[field]);
        }
      }
    }
    return artifact.content || 'No preview available';
  };

  const getStatusChip = () => {
    if (artifact.type === 'voice_memo') {
      const typedArtifact = artifact as any;
      const status = typedArtifact.transcription_status || 'pending';
      const statusConfig = {
        completed: { color: '#d4edda', textColor: '#155724', label: 'Transcribed' },
        processing: { color: '#fff3cd', textColor: '#856404', label: 'Processing' },
        pending: { color: '#c8e6c9', textColor: '#2e7d32', label: 'Pending' },
        failed: { color: '#f8d7da', textColor: '#721c24', label: 'Failed' }
      };
      const currentStatusConfig = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
      return (
        <Chip
          label={currentStatusConfig.label}
          size="small"
          sx={{ backgroundColor: currentStatusConfig.color, color: currentStatusConfig.textColor, fontSize: '11px', height: '20px', mb: 1, fontWeight: 600 }}
        />
      );
    }
    return null;
  };

  const getDurationInfo = () => {
    if (artifact.type === 'voice_memo') {
        const typedArtifact = artifact as any;
        if (typedArtifact.duration_seconds) {
            return `${typedArtifact.duration_seconds}s`;
        }
    }
    return 'Artifact';
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick(artifact);
    }
  };

  const ariaLabel = `${config.label} at ${timeString}. ${getPreviewContent()}. Click to view details.`;

  return (
    <Box sx={getItemStyles(position)}> {/* Apply item styles */}
      {/* Timeline Dot - needs responsive positioning */}
      <Box sx={{
        position: 'absolute',
        left: { xs: '-10px', md: '50%' }, // Adjusted for mobile (relative to item's pl)
        top: '20px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: config.color,
        border: '4px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transform: { xs: 'translateX(0)', md: 'translateX(-50%)' }, // No X-transform needed for mobile if pl pushes item
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon sx={{ fontSize: '10px', color: 'white' }} />
      </Box>

      {/* Connector Line - needs responsive positioning/styling */}
      {/* On mobile, this connector might be better as a vertical segment or hidden */}
      {/* For now, attempting to adjust it. This will be tricky. */}
      <Box sx={{
        display: { xs: 'none', md: 'block' }, // Hide connector on mobile for simplicity first
        position: 'absolute',
        left: '50%',
        top: '30px',
        width: '22%', // This width is for desktop when card is 44%
        height: '2px',
        backgroundColor: config.color,
        transform: position === 'left' 
          ? 'translateX(-100%) translateX(-10px)' 
          : 'translateX(10px)',
        zIndex: 5
      }} />

      {/* Artifact Card */}
      <Paper
        elevation={2}
        onClick={() => onClick(artifact)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        sx={getCardStyles(config.color, position)} // Apply card styles
      >
        {/* Card Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ padding: '4px 8px', backgroundColor: config.bgColor, borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <Icon sx={{ fontSize: '16px', color: config.color }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: config.color, fontSize: '14px' }}>
              {config.label}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
            {timeString}
          </Typography>
        </Box>
        {getStatusChip()}
        <Typography sx={{ fontSize: '14px', color: '#333', lineHeight: 1.4, mb: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {getPreviewContent()}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f0f0f0' }}>
          <Typography sx={{ fontSize: '11px', color: '#888' }}>
            {getDurationInfo()}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: config.color, fontWeight: 500 }}>
            Click to view →
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}; 