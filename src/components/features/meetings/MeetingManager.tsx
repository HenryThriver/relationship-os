'use client';

import React from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import { MeetingArtifactCard } from './MeetingArtifactCard';
import { MeetingDetailModal } from './MeetingDetailModal';
import { MeetingContentUpload } from './MeetingContentUpload';
import { useMeetingModals } from '@/lib/hooks/useMeetingModals';
import { useMeetings } from '@/lib/hooks/useMeetings';
import type { MeetingArtifact } from '@/types/artifact';

interface MeetingManagerProps {
  contactId?: string;
  limit?: number;
  includeUpcoming?: boolean;
  showAsCards?: boolean;
  onMeetingClick?: (meeting: MeetingArtifact) => void;
}

export const MeetingManager: React.FC<MeetingManagerProps> = ({
  contactId,
  limit,
  includeUpcoming = false,
  showAsCards = true,
  onMeetingClick,
}) => {
  const {
    meetings,
    loading,
    error,
    refetch
  } = useMeetings({ contactId });

  const {
    // Modal states
    detailModalOpen,
    contentUploadModalOpen,
    selectedMeeting,
    
    // Modal actions
    openDetailModal,
    closeDetailModal,
    openContentUploadModal,
    closeContentUploadModal,
    
    // Content management
    saveMeetingContent,
    updateActionItem,
    applySuggestion,
    
    // Loading states
    saving,
    error: modalError,
  } = useMeetingModals();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const handleMeetingClick = (meeting: MeetingArtifact) => {
    if (onMeetingClick) {
      onMeetingClick(meeting);
    } else {
      openDetailModal(meeting);
    }
  };

  const handleAddContent = (meeting: MeetingArtifact) => {
    openContentUploadModal(meeting);
  };

  const handleSaveContent = async (contentType: 'notes' | 'transcript' | 'recording', content: string | File) => {
    try {
      await saveMeetingContent(contentType, content);
      setSnackbarMessage(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} saved successfully!`);
      setSnackbarOpen(true);
      closeContentUploadModal();
      // Refresh meetings to get updated data
      refetch();
    } catch (err) {
      console.error('Error saving content:', err);
      // Error is handled by the hook
    }
  };

  const handleUpdateActionItem = async (artifactId: string, actionItemId: string, completed: boolean) => {
    try {
      await updateActionItem(artifactId, actionItemId, completed);
      setSnackbarMessage(`Action item ${completed ? 'completed' : 'reopened'}!`);
      setSnackbarOpen(true);
      // Refresh meetings to get updated data
      refetch();
    } catch (err) {
      console.error('Error updating action item:', err);
      // Error is handled by the hook
    }
  };

  const handleApplySuggestion = async (artifactId: string, suggestionId: string) => {
    try {
      await applySuggestion(artifactId, suggestionId);
      setSnackbarMessage('Suggestion applied successfully!');
      setSnackbarOpen(true);
      // Refresh meetings to get updated data
      refetch();
    } catch (err) {
      console.error('Error applying suggestion:', err);
      // Error is handled by the hook
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load meetings: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Meeting Cards */}
      {showAsCards && (
        <Box display="flex" flexDirection="column" gap={2}>
          {meetings.map((meeting) => (
            <MeetingArtifactCard
              key={meeting.id}
              artifact={meeting}
              onOpenModal={handleMeetingClick}
              onAddContent={handleAddContent}
              onUpdateActionItem={handleUpdateActionItem}
              onApplySuggestion={handleApplySuggestion}
            />
          ))}
        </Box>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          open={detailModalOpen}
          onClose={closeDetailModal}
          meeting={selectedMeeting}
          onUpdateActionItem={handleUpdateActionItem}
          onApplySuggestion={handleApplySuggestion}
          onAddContent={handleAddContent}
        />
      )}

      {/* Meeting Content Upload Modal */}
      {selectedMeeting && (
        <MeetingContentUpload
          open={contentUploadModalOpen}
          onClose={closeContentUploadModal}
          meeting={selectedMeeting}
          onSave={handleSaveContent}
          processing={saving}
          processingStatus={selectedMeeting.ai_parsing_status || undefined}
        />
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Error Alert */}
      {modalError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {modalError}
        </Alert>
      )}
    </Box>
  );
}; 