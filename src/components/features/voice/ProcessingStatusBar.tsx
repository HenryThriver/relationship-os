import React from 'react';
import { Alert, CircularProgress, Typography } from '@mui/material';
// import { Error as ErrorIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface ProcessingStatusBarProps {
  activeProcessingCount: number;
  contactName?: string;
}

export const ProcessingStatusBar: React.FC<ProcessingStatusBarProps> = ({
  activeProcessingCount,
  contactName,
}) => {
  if (activeProcessingCount <= 0) {
    return null;
  }

  const message = contactName
    ? `Processing ${activeProcessingCount} voice memo(s) for ${contactName}...`
    : `Processing ${activeProcessingCount} voice memo(s) for insights...`;

  return (
    <Alert 
      severity="info" 
      iconMapping={{
        info: <CircularProgress size={20} color="inherit" />
      }}
      sx={{ 
        width: '100%', 
        mb: 2, // Add margin bottom for spacing if needed
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Alert>
  );
}; 