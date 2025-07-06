'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { SuggestionNotificationBadge } from './SuggestionNotificationBadge';
import { SuggestionsModal } from './SuggestionsModal';
import { useUpdateSuggestions } from '@/lib/hooks/useUpdateSuggestions';

interface UnifiedSuggestionManagerProps {
  contactId: string;
  // Display modes
  showBellBadge?: boolean;      // For header notification
  showSidebarButton?: boolean;  // For sidebar "View Suggestions" button
  
  // Custom styling
  priority?: 'high' | 'medium' | 'low';
}

export const UnifiedSuggestionManager: React.FC<UnifiedSuggestionManagerProps> = ({
  contactId,
  showBellBadge = false,
  showSidebarButton = false,
  priority,
}) => {
  // const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const {
    suggestions,
    isLoading,
    pendingCount,
    highConfidenceCount,
    markAsViewed,
    bulkApply,
    bulkReject,
    isBulkProcessing,
  } = useUpdateSuggestions({ contactId });

  // Determine priority automatically if not specified
  const effectivePriority = priority || (highConfidenceCount > 0 ? 'high' : pendingCount > 0 ? 'medium' : 'low');
  
  const hasNewSuggestions = suggestions?.some(s => !s.viewed_at) || false;

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApplySuggestions = useCallback(async (suggestionIds: string[], selectedPathsMap: Record<string, string[]>) => {
    await bulkApply({ suggestionIds, selectedPathsMap });
    if (suggestionIds.length === suggestions?.length) {
      // If all suggestions were processed, close the panel
      setIsOpen(false);
    }
  }, [bulkApply, suggestions?.length]);

  const handleRejectSuggestions = useCallback(async (suggestionIds: string[]) => {
    await bulkReject({ suggestionIds });
    if (suggestionIds.length === suggestions?.length) {
      // If all suggestions were processed, close the panel
      setIsOpen(false);
    }
  }, [bulkReject, suggestions?.length]);

  const handleMarkAsViewed = useCallback(async (suggestionId: string) => {
    await markAsViewed({ suggestionId });
  }, [markAsViewed]);

  // Render notification badge for header
  const renderBellBadge = () => {
    if (!showBellBadge || pendingCount === 0) return null;
    
    return (
      <SuggestionNotificationBadge
        contactId={contactId}
        count={pendingCount}
        onClick={handleOpen}
        priority={effectivePriority}
        hasNewSuggestions={hasNewSuggestions}
      />
    );
  };

  // Render sidebar button
  const renderSidebarButton = () => {
    if (!showSidebarButton) return null;
    
    return (
      <Button 
        variant="outlined" 
        fullWidth 
        onClick={handleOpen}
        color={effectivePriority === 'high' ? 'error' : 'primary'}
        disabled={pendingCount === 0}
        startIcon={<NotificationsIcon />}
      >
        {pendingCount === 0 ? 'No Suggestions' : `View Suggestions (${pendingCount})`}
      </Button>
    );
  };

  // Render suggestions modal
  const renderSuggestionsModal = () => {
    return (
      <SuggestionsModal
        open={isOpen}
        onClose={handleClose}
        contactName="Contact" // Could be enhanced to get actual name
        suggestions={suggestions || []}
        onApplySuggestions={handleApplySuggestions}
        onRejectSuggestions={handleRejectSuggestions}
        onMarkAsViewed={handleMarkAsViewed}
        isLoading={isLoading || isBulkProcessing}
      />
    );
  };

  return (
    <>
      {/* Render the appropriate UI elements based on props */}
      {renderBellBadge()}
      {renderSidebarButton()}
      
      {/* Always render the modal when open */}
      {renderSuggestionsModal()}
    </>
  );
};

// Export individual components for specific use cases
export const SuggestionBellBadge: React.FC<Pick<UnifiedSuggestionManagerProps, 'contactId' | 'priority'>> = (props) => (
  <UnifiedSuggestionManager {...props} showBellBadge={true} />
);

export const SuggestionSidebarButton: React.FC<Pick<UnifiedSuggestionManagerProps, 'contactId' | 'priority'>> = (props) => (
  <UnifiedSuggestionManager {...props} showSidebarButton={true} />
);

export const FullSuggestionManager: React.FC<Pick<UnifiedSuggestionManagerProps, 'contactId' | 'priority'>> = (props) => (
  <UnifiedSuggestionManager {...props} showBellBadge={true} showSidebarButton={true} />
); 