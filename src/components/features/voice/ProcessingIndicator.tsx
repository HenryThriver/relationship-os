import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { formatDuration, getElapsedTime } from '@/lib/utils/time'; // Ensure this path is correct

interface ProcessingIndicatorProps {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  startTime?: string; // ISO string
  message?: string;
  showTimer?: boolean;
  compact?: boolean;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  status,
  startTime,
  message,
  showTimer = false,
  compact = false,
}) => {
  const [elapsedTime, setElapsedTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'processing' && startTime && showTimer) {
      const updateTimer = () => {
        setElapsedTime(formatDuration(getElapsedTime(startTime)));
      };
      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime, showTimer]);

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'info.main';
      case 'completed':
        return 'success.main';
      case 'failed':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'processing':
        return <CircularProgress size={compact ? 16 : 20} color="inherit" />;
      case 'completed':
        return <CheckCircleIcon fontSize={compact ? 'small' : 'inherit'} color="inherit" />;
      case 'failed':
        return <ErrorIcon fontSize={compact ? 'small' : 'inherit'} color="inherit" />;
      case 'idle':
      default:
        return <HourglassEmptyIcon fontSize={compact ? 'small' : 'inherit'} color="inherit" />;
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 1,
        color: getStatusColor(),
      }}
    >
      {renderIcon()}
      {(message || (showTimer && elapsedTime)) && (
        <Typography variant={compact ? 'caption' : 'body2'} color="inherit">
          {message}
          {message && showTimer && elapsedTime && ' - '}
          {showTimer && elapsedTime}
        </Typography>
      )}
    </Box>
  );
}; 