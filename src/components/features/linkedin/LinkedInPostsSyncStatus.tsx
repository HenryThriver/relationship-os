'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Paper,
} from '@mui/material';
import {
  Sync,
  CheckCircle,
  Error,
  Schedule,
  LinkedIn,
} from '@mui/icons-material';

interface LinkedInPostsSyncStatusProps {
  contactId: string;
  contactName?: string;
  lastSyncAt?: string | null;
  syncStatus?: string;
  postsCount?: number;
  onManualSync?: () => Promise<void>;
  className?: string;
}

export const LinkedInPostsSyncStatus: React.FC<LinkedInPostsSyncStatusProps> = ({
  contactId,
  contactName,
  lastSyncAt,
  syncStatus = 'never',
  postsCount = 0,
  onManualSync,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getSyncStatusChip = () => {
    switch (syncStatus) {
      case 'completed':
        return (
          <Chip 
            label="Synced" 
            color="success" 
            icon={<CheckCircle />} 
            size="small" 
          />
        );
      case 'in_progress':
        return (
          <Chip 
            label="Syncing..." 
            color="info" 
            icon={<CircularProgress size={12} />} 
            size="small" 
          />
        );
      case 'failed':
        return (
          <Chip 
            label="Failed" 
            color="error" 
            icon={<Error />} 
            size="small" 
          />
        );
      default:
        return (
          <Chip 
            label="Never Synced" 
            color="default" 
            icon={<Schedule />} 
            size="small" 
          />
        );
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never synced';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch {
      return 'Unknown';
    }
  };

  const handleManualSync = async () => {
    if (onManualSync) {
      await onManualSync();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/linkedin/sync-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage((result as any).message);
      } else {
        throw new Error((result as any).error || 'Sync failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync LinkedIn posts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canSync = syncStatus !== 'in_progress' && !isLoading;

  return (
    <Paper 
      variant="outlined" 
      className={className}
      sx={{ p: 2, bgcolor: 'grey.50' }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <LinkedIn sx={{ color: '#0077B5' }} />
        <Box flexGrow={1}>
          <Typography variant="subtitle2" fontWeight="bold">
            LinkedIn Posts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {postsCount > 0 
              ? `${postsCount} post${postsCount > 1 ? 's' : ''} • Last sync: ${formatLastSync(lastSyncAt || null)}`
              : formatLastSync(lastSyncAt || null)
            }
          </Typography>
        </Box>
        {getSyncStatusChip()}
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {syncStatus === 'never' 
            ? 'Sync LinkedIn posts to see activity timeline'
            : syncStatus === 'failed'
            ? 'Last sync failed. Try again?'
            : syncStatus === 'in_progress'
            ? 'Syncing posts from LinkedIn...'
            : `${postsCount} posts synced`
          }
        </Typography>
        
        <Button
          size="small"
          variant="outlined"
          startIcon={isLoading ? <CircularProgress size={14} /> : <Sync />}
          onClick={handleManualSync}
          disabled={!canSync}
          sx={{ 
            color: '#0077B5', 
            borderColor: '#0077B5',
            '&:hover': {
              borderColor: '#005885',
              backgroundColor: 'rgba(0, 119, 181, 0.04)',
            }
          }}
        >
          {isLoading ? 'Syncing...' : 'Sync Posts'}
        </Button>
      </Box>

      {/* Progress indicator for in-progress sync */}
      {syncStatus === 'in_progress' && (
        <Box mt={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Fetching posts from LinkedIn API...
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}; 