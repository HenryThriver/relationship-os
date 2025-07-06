import React from 'react';
import { Box } from '@mui/material';
import { ToastItem } from './ToastItem';
import { useToast } from '@/lib/contexts/ToastContext';

// Re-define Toast interface here if not imported, or ensure it is exported from context and imported properly
// interface Toast {
//   id: string;
//   message: string;
//   type: 'success' | 'info' | 'warning' | 'error';
//   duration?: number;
//   icon?: ReactNode;
//   action?: {
//     label: string;
//     onClick: () => void;
//   };
// }

// Props for ToastContainer itself are minimal if it consumes context internally
// interface ToastContainerProps {
//   toasts: Toast[]; // This would be needed if not using context directly
//   onHideToast: (id: string) => void; // This would be needed if not using context directly
// }

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (!toasts.length) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1400, // Higher than MUI Drawer, Appbar etc.
        width: 'auto',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 1, // Spacing between toasts, mb on ToastItem also contributes
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={() => hideToast(toast.id)} />
      ))}
    </Box>
  );
}; 