'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration';

interface GmailConnectionCardProps {
  className?: string;
}

export const GmailConnectionCard: React.FC<GmailConnectionCardProps> = ({
  className,
}) => {
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  
  const {
    isConnected,
    connectionStatus,
    isLoading,
    error,
    connectGmail,
    disconnectGmail,
    isSyncing,
    syncProgress,
    syncState,
    refreshStatus,
    syncContactEmails,
  } = useGmailIntegration();

  const handleConnect = () => {
    connectGmail();
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGmail();
      setDisconnectDialogOpen(false);
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <CircularProgress size={20} />;
    }
    if (isConnected) {
      return <CheckCircleIcon color="success" />;
    }
    if (error) {
      return <ErrorIcon color="error" />;
    }
    return <EmailIcon color="disabled" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking connection...';
    if (isConnected && connectionStatus) {
      return `Connected as ${connectionStatus.email_address}`;
    }
    if (error) return 'Connection error';
    return 'Not connected';
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' | 'default' => {
    if (isConnected) return 'success';
    if (error) return 'error';
    return 'default';
  };

  const getSyncStatusText = () => {
    if (isSyncing && syncProgress) {
      return syncProgress.current_status;
    }
    if (syncState?.sync_status === 'syncing') {
      return 'Sync in progress...';
    }
    if (syncState?.sync_status === 'error') {
      return `Sync error: ${syncState.error_message}`;
    }
    if (syncState?.last_sync_timestamp) {
      return `Last synced ${formatDistanceToNow(parseISO(syncState.last_sync_timestamp), { addSuffix: true })}`;
    }
    return 'Never synced';
  };

  const getSyncProgress = () => {
    if (!syncProgress) return 0;
    return syncProgress.total_emails > 0 
      ? (syncProgress.processed_emails / syncProgress.total_emails) * 100 
      : 0;
  };

  return (
    <>
      <Card className={className} sx={{ maxWidth: 600 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {getStatusIcon()}
            <Box flexGrow={1}>
              <Typography variant="h6" component="h2">
                Gmail Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getStatusText()}
              </Typography>
            </Box>
            <Chip 
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={getStatusColor()}
              variant="outlined"
              size="small"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isConnected && connectionStatus && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Connection Details
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mb={2}>
                <Typography variant="body2">
                  <strong>Email:</strong> {connectionStatus.email_address}
                </Typography>
                {connectionStatus.total_emails_synced !== undefined && (
                  <Typography variant="body2">
                    <strong>Total Emails Synced:</strong> {connectionStatus.total_emails_synced}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Sync Status:</strong> {getSyncStatusText()}
                </Typography>
              </Box>

              {/* Sync Progress */}
              {(isSyncing || syncState?.sync_status === 'syncing') && (
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    Sync Progress
                  </Typography>
                  <LinearProgress 
                    variant={syncProgress ? "determinate" : "indeterminate"}
                    value={getSyncProgress()}
                    sx={{ mb: 1 }}
                  />
                  {syncProgress && (
                    <Typography variant="caption" color="text.secondary">
                      {syncProgress.processed_emails} of {syncProgress.total_emails} emails processed
                      {syncProgress.created_artifacts > 0 && ` • ${syncProgress.created_artifacts} new artifacts`}
                      {syncProgress.errors > 0 && ` • ${syncProgress.errors} error&apos;s`}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Sync Error */}
              {syncState?.sync_status === 'error' && syncState.error_message && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Sync failed: {syncState.error_message}
                </Alert>
              )}
            </Box>
          )}

          {!isConnected && !error && (
            <Typography variant="body2" color="text.secondary">
              Connect your Gmail account to automatically sync email conversations with your contacts. 
              This helps build a complete relationship timeline.
            </Typography>
          )}
        </CardContent>

        <CardActions>
          {!isConnected ? (
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={handleConnect}
              disabled={isLoading}
            >
              Connect Gmail
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshStatus}
                disabled={isLoading}
              >
                Refresh Status
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => setDisconnectDialogOpen(true)}
                disabled={isLoading || isSyncing}
              >
                Disconnect
              </Button>
            </>
          )}
        </CardActions>

        {isConnected && (
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>How to sync emails:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              • Go to any contact&apos;s profile page<br/>
              • View their timeline to automatically sync emails<br/>
              • Or visit a contact and emails will sync in the background
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Test Email Sync:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You can test email sync by providing a contact ID and email address:
            </Typography>
            
            {/* Manual sync form for testing */}
            <Box component="form" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const testContactId = formData.get('contactId') as string;
              const testEmail = formData.get('email') as string;
              
              if (testContactId && testEmail) {
                syncContactEmails({
                  contact_id: testContactId,
                  email_addresses: [testEmail],
                  max_results: 50
                });
              }
            }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                name="contactId"
                placeholder="Contact ID (from URL)"
                size="small"
                variant="outlined"
              />
              <TextField
                name="email"
                placeholder="Email address to sync"
                size="small"
                variant="outlined"
                type="email"
              />
              <Button
                type="submit"
                variant="outlined"
                size="small"
                disabled={isSyncing}
                startIcon={isSyncing ? <CircularProgress size={16} /> : undefined}
              >
                {isSyncing ? 'Syncing...' : 'Test Sync'}
              </Button>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={() => setDisconnectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Disconnect Gmail?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect your Gmail account? This will:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Stop future email synchronization</li>
            <li>Remove stored access tokens</li>
            <li>Preserve existing email artifacts in your timeline</li>
          </Box>
          <Typography sx={{ mt: 2 }} color="text.secondary">
            You can reconnect at any time to resume email synchronization.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDisconnect}
            color="error"
            variant="contained"
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GmailConnectionCard; 