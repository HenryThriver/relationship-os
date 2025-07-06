import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  GmailConnectionStatus, 
  EmailImportRequest, 
  EmailSyncProgress,
  GmailSyncState 
} from '@/types/email';

interface UseGmailIntegrationReturn {
  // Connection status
  isConnected: boolean;
  connectionStatus: GmailConnectionStatus | null;
  isLoading: boolean;
  error: string | null;

  // Gmail connection actions
  connectGmail: () => void;
  disconnectGmail: () => Promise<void>;
  
  // Email sync operations
  syncContactEmails: (request: EmailImportRequest) => Promise<EmailSyncProgress>;
  isSyncing: boolean;
  syncProgress: EmailSyncProgress | null;
  
  // Sync state
  syncState: GmailSyncState | null;
  
  // Utilities
  refreshStatus: () => void;
}

export const useGmailIntegration = (): UseGmailIntegrationReturn => {
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<EmailSyncProgress | null>(null);
  const queryClient = useQueryClient();

  // Get Gmail connection status
  const {
    data: statusData,
    isLoading,
    refetch: refreshStatus,
  } = useQuery({
    queryKey: ['gmail', 'status'],
    queryFn: async (): Promise<{
      isConnected: boolean;
      profile: Record<string, unknown>;
      syncState: GmailSyncState | null;
    }> => {
      const response = await fetch('/api/gmail/sync');
      if (!response.ok) {
        throw new Error('Failed to get Gmail status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Gmail connection mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/gmail/auth');
      if (!response.ok) {
        throw new Error('Failed to initiate Gmail connection');
      }
      const { authUrl } = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Gmail disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect Gmail');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Email sync mutation
  const syncMutation = useMutation({
    mutationFn: async (request: EmailImportRequest): Promise<EmailSyncProgress> => {
      setSyncProgress({
        total_emails: 0,
        processed_emails: 0,
        created_artifacts: 0,
        updated_artifacts: 0,
        errors: 0,
        current_status: 'Starting sync...',
      });

      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Email sync failed');
      }

      const result = await response.json();
      return result.progress;
    },
    onSuccess: (progress) => {
      setSyncProgress(progress);
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      setSyncProgress(prev => prev ? {
        ...prev,
        current_status: `Error: ${error.message}`,
      } : null);
    },
  });

  // Clear error when status changes
  useEffect(() => {
    if (statusData?.isConnected) {
      setError(null);
    }
  }, [statusData?.isConnected]);

  // Create connection status object
  const connectionStatus: GmailConnectionStatus | null = statusData ? {
    is_connected: statusData.isConnected,
    email_address: typeof statusData.profile?.email === 'string' ? statusData.profile.email : undefined,
    connection_date: undefined, // Not provided by current API
    last_sync: statusData.syncState?.last_sync_timestamp,
    total_emails_synced: statusData.syncState?.total_emails_synced,
    sync_status: statusData.syncState?.sync_status || 'idle',
    error_message: statusData.syncState?.error_message,
    permissions: undefined, // Not provided by current API
  } : null;

  const connectGmail = useCallback(() => {
    connectMutation.mutate();
  }, [connectMutation]);

  const disconnectGmail = useCallback(async () => {
    return disconnectMutation.mutateAsync();
  }, [disconnectMutation]);

  const syncContactEmails = useCallback(async (request: EmailImportRequest) => {
    return syncMutation.mutateAsync(request);
  }, [syncMutation]);

  return {
    // Connection status
    isConnected: statusData?.isConnected || false,
    connectionStatus,
    isLoading,
    error,

    // Gmail connection actions
    connectGmail,
    disconnectGmail,
    
    // Email sync operations
    syncContactEmails,
    isSyncing: syncMutation.isPending,
    syncProgress,
    
    // Sync state
    syncState: statusData?.syncState || null,
    
    // Utilities
    refreshStatus: () => refreshStatus(),
  };
};

export default useGmailIntegration; 