'use client';

import React, { useMemo, useCallback } from 'react';
import { Badge, IconButton, Tooltip, keyframes } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

interface SuggestionNotificationBadgeProps {
  contactId: string;
  count: number;
  onClick: () => void;
  priority?: 'high' | 'medium' | 'low';
  hasNewSuggestions?: boolean;
}

const SuggestionNotificationBadgeComponent: React.FC<SuggestionNotificationBadgeProps> = ({
  contactId,
  count,
  onClick,
  priority = 'medium',
  hasNewSuggestions = false
}) => {
  const badgeColor = useMemo(() => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  }, [priority]);

  const tooltipText = useMemo(() => {
    const priorityText = priority === 'high' ? 'high priority' : priority;
    return `${count} ${priorityText} suggestion${count > 1 ? 's' : ''} pending`;
  }, [count, priority]);

  const iconColor = useMemo(() => {
    return priority === 'high' ? 'error' : 'action';
  }, [priority]);

  const animationStyle = useMemo(() => {
    return hasNewSuggestions ? `${pulseAnimation} 2s infinite` : 'none';
  }, [hasNewSuggestions]);

  if (count === 0) {
    return null;
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          ml: 1,
          animation: animationStyle,
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
        aria-label={`View ${count} pending suggestions`}
      >
        <Badge
          badgeContent={count}
          color={badgeColor}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              fontWeight: 600,
              minWidth: '20px',
              height: '20px',
            }
          }}
        >
          <NotificationsIcon 
            fontSize="small" 
            color={iconColor} 
          />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

SuggestionNotificationBadgeComponent.displayName = 'SuggestionNotificationBadge';

export const SuggestionNotificationBadge = React.memo(SuggestionNotificationBadgeComponent);