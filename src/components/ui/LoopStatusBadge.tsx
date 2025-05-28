import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { LoopStatus } from '@/types/artifact';

interface LoopStatusBadgeProps {
  status: LoopStatus;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
}

const STATUS_CONFIG: Record<LoopStatus, { color: ChipProps['color']; label: string }> = {
  [LoopStatus.IDEA]: { color: 'default', label: 'Idea' },
  [LoopStatus.QUEUED]: { color: 'info', label: 'Queued' },
  [LoopStatus.OFFERED]: { color: 'primary', label: 'Offered' },
  [LoopStatus.RECEIVED]: { color: 'primary', label: 'Received' },
  [LoopStatus.ACCEPTED]: { color: 'success', label: 'Accepted' },
  [LoopStatus.DECLINED]: { color: 'error', label: 'Declined' },
  [LoopStatus.IN_PROGRESS]: { color: 'warning', label: 'In Progress' },
  [LoopStatus.PENDING_APPROVAL]: { color: 'warning', label: 'Pending Approval' },
  [LoopStatus.DELIVERED]: { color: 'success', label: 'Delivered' },
  [LoopStatus.FOLLOWING_UP]: { color: 'info', label: 'Following Up' },
  [LoopStatus.COMPLETED]: { color: 'success', label: 'Completed' },
  [LoopStatus.ABANDONED]: { color: 'error', label: 'Abandoned' }
};

export const LoopStatusBadge: React.FC<LoopStatusBadgeProps> = ({ 
  status, 
  size = 'small', 
  variant = 'filled' 
}) => {
  const config = STATUS_CONFIG[status];
  
  if (!config) {
    return (
      <Chip
        label="Unknown Status"
        color="default"
        size={size}
        variant={variant}
      />
    );
  }
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={variant}
    />
  );
}; 