'use client';

import React from 'react';
import {
  Modal, Box, Typography, IconButton, Paper, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableRow
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getArtifactConfig } from '@/config/artifactConfig';
import type { ArtifactGlobal } from '@/types';
import { format, parseISO } from 'date-fns';

interface ArtifactModalProps {
  artifact: ArtifactGlobal | null;
  open: boolean;
  onClose: () => void;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
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
  pr: 1, // For scrollbar spacing
  mr: -1, // Counteract scrollbar spacing if it appears
  flexGrow: 1,
};

// Helper to render content, especially for nested objects or arrays
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
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {/* Basic formatting */}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>{renderContent(value, level + 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  return <Typography variant="body2" color="text.secondary">N/A</Typography>; // Fallback for null/undefined etc.
};

export const ArtifactModal: React.FC<ArtifactModalProps> = ({ artifact, open, onClose }) => {
  if (!artifact) return null;

  const config = getArtifactConfig(artifact.type);
  const { icon: Icon, badgeLabel, color } = config;

  // Determine what to render in detail: metadata first, then content as fallback
  const detailContentToRender = artifact.metadata 
    ? artifact.metadata 
    : (artifact.content || "No details available");

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip label={artifact.type} size="small" sx={{ backgroundColor: color, color: color ? 'white' : 'inherit' }} />
            <Typography variant="caption" color="text.secondary">
              {artifact.timestamp ? format(parseISO(artifact.timestamp), 'PPP p') : 'Date/Time unknown'}
            </Typography>
          </Box>

          {renderContent(detailContentToRender)}

          {/* Optional: Display raw JSON for debugging or full detail */}
          {/* <Typography variant="subtitle2" sx={{mt: 3, mb:1}}>Raw Data:</Typography>
          <Paper variant="outlined" sx={{p:1, maxHeight: 200, overflowY: 'auto', backgroundColor: 'grey.100'}}>
            <pre style={{margin: 0, fontSize: '0.8rem'}}>{JSON.stringify(artifact.content, null, 2)}</pre>
          </Paper> */}
        </Box>
      </Box>
    </Modal>
  );
}; 