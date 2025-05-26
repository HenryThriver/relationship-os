import React, { useEffect, useState, ReactNode } from 'react';
import { Alert, AlertTitle, IconButton, LinearProgress, Box, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
}

const typeIcons = {
  success: <CheckCircleOutlineIcon fontSize="inherit" />,
  info: <InfoOutlinedIcon fontSize="inherit" />,
  warning: <WarningAmberOutlinedIcon fontSize="inherit" />,
  error: <ErrorOutlineOutlinedIcon fontSize="inherit" />,
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const { id, message, type, duration, icon, action } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress <= 0) {
            clearInterval(timer);
            onHide();
            return 0;
          }
          return prevProgress - (100 / (duration / 100));
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [duration, onHide]);

  const handleClose = () => {
    setProgress(0); // Stop progress immediately
    onHide();
  };

  const alertIcon = icon || typeIcons[type];

  return (
    <Alert
      severity={type}
      icon={alertIcon}
      action={(
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {action && (
            <Button color="inherit" size="small" onClick={() => { action.onClick(); handleClose(); }} sx={{ mr: 1}}>
              {action.label}
            </Button>
          )}
          <IconButton color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Box>
      )}
      sx={{
        width: '100%',
        mb: 1, // For stacking multiple toasts
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        opacity: 1,
        transform: 'translateX(0)',
        // Add specific styles for enter/exit if needed via a state like `isVisible`
      }}
    >
      <AlertTitle sx={{ textTransform: 'capitalize' }}>{type}</AlertTitle>
      <Typography variant="body2">{message}</Typography>
      {duration && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={type} 
          sx={{ 
            height: '2px', 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            backgroundColor: 'transparent' // Ensure progress bar BG is transparent
          }}
        />
      )}
    </Alert>
  );
}; 