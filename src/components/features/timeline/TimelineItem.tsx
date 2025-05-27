'use client';

import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { getArtifactConfig } from '@/config/artifactConfig'; // Will create this based on sourceConfig
import type { ArtifactGlobal } from '@/types';
import { format, parseISO } from 'date-fns';

interface TimelineItemProps {
  artifact: ArtifactGlobal;
  onClick: () => void;
  // position?: 'left' | 'right'; // Keep for potential future use, but not used for now
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ artifact, onClick }) => {
  const config = getArtifactConfig(artifact.type);

  const { icon: Icon, badgeLabel, getPreview } = config;
  const previewContent = getPreview 
    ? getPreview(artifact.metadata || artifact.content) // Prefer metadata, fallback to content string
    : (typeof artifact.content === 'string' ? truncateText(artifact.content) : 'No preview available');

  // Format timestamp for display
  // We only need the time here, as the date is displayed as a group header
  const formattedTime = artifact.timestamp ? format(parseISO(artifact.timestamp), 'h:mm a') : 'Time unknown';

  return (
    <Box 
      sx={{
        display: 'flex',
        position: 'relative',
        ml: '16px', // Offset from the timeline line
        pl: 3,      // Padding to the left of the content, after the dot
        mb: 2,      // Margin between items
      }}
    >
      {/* Timeline Dot */}
      <Box
        sx={{
          position: 'absolute',
          left: '-7px', // Position the dot onto the line (16px - 7px approx centers a 14px dot on a 2px line)
          top: '4px',    // Align with the text or icon top
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: config.color || 'primary.main',
          border: '2px solid',
          borderColor: 'background.paper',
          zIndex: 1,
        }}
      />
      
      <Paper 
        elevation={1} 
        onClick={onClick}
        sx={{
          p: 2,
          width: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s',
          '&:hover': {
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {Icon && <Icon sx={{ mr: 1.5, color: config.color || 'inherit' }} />}
          <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1 }}>
            {badgeLabel || artifact.type} 
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formattedTime}
          </Typography>
        </Box>
        
        <Box sx={{ pl: Icon ? '36px' : 0 }}> {/* Indent content if icon is present */}
          {typeof previewContent === 'string' ? (
            <Typography variant="body2" color="text.secondary" sx={{ 
              whiteSpace: 'pre-line',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
             }}>
              {previewContent}
            </Typography>
          ) : (
            previewContent // If getPreview returns a JSX.Element
          )}
        </Box>
        
        {/* Optional: Add a small chip for artifact type if not clear from icon/title */}
        {/* <Chip size="small" label={artifact.type} sx={{ mt: 1, backgroundColor: config.color, color: 'white' }} /> */}
      </Paper>
    </Box>
  );
};

// Helper function from artifactConfig.ts, if not already there, or define locally
const truncateText = (text: string, maxLength = 100): string => {
  if (typeof text !== 'string') return 'Invalid content';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}; 