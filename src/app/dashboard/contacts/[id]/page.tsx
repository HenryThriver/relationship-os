'use client';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamically rendered

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, Alert, List, ListItemText, ListItemButton, Button } from '@mui/material';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { default as nextDynamic } from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';

// Import actual components
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { NextConnection } from '@/components/features/contacts/NextConnection';
import { ActionQueues, ActionItemStatus as ActionQueuesActionItemStatus } from '@/components/features/contacts/ActionQueues';
import { ReciprocityDashboard } from '@/components/features/contacts/ReciprocityDashboard';
import { ContextSections } from '@/components/features/contacts/ContextSections';
import { QuickAdd } from '@/components/features/contacts/QuickAdd';
import { ArtifactModal } from '@/components/features/timeline/ArtifactModal';

// Import LoopDashboard
import { LoopDashboard } from '@/components/features/loops/LoopDashboard';

// Dynamically import VoiceRecorder
const VoiceRecorder = nextDynamic(() => 
  import('@/components/features/voice-memos/VoiceRecorder').then(mod => mod.VoiceRecorder),
  { 
    ssr: false, 
    loading: () => <CircularProgress size={20} sx={{display: 'block', margin: 'auto'}} /> 
  }
);

// Import new suggestion components
import { SuggestionsPanel } from '@/components/features/suggestions/SuggestionsPanel';
// Placeholder for the new VoiceMemoDetailModal
import { VoiceMemoDetailModal } from '@/components/features/voice/VoiceMemoDetailModal'; // Uncommented

// Import hooks and types
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import { useVoiceMemos, ProcessingStatus as VoiceMemoProcessingStatus } from '@/lib/hooks/useVoiceMemos';
// Import useUpdateSuggestions hook
import { useUpdateSuggestions } from '@/lib/hooks/useUpdateSuggestions';
import { useArtifacts } from '@/lib/hooks/useArtifacts';
import { useArtifactModalData } from '@/lib/hooks/useArtifactModalData';
import type { 
    ArtifactGlobal,
    POGArtifactContent,
    AskArtifactContent,
    POGArtifactContentStatus,
    AskArtifactContentStatus,
    PersonalContext as PersonalContextType,
    VoiceMemoArtifact,
    POGArtifact,
    AskArtifact,
    LinkedInArtifactContent,
} from '@/types';
import { useToast } from '@/lib/contexts/ToastContext';
import { ProcessingIndicator } from '@/components/features/voice/ProcessingIndicator';
import { ProcessingStatusBar } from '@/components/features/voice/ProcessingStatusBar'; // Revert to alias import

interface ContactProfilePageProps {
  // Empty interface for future props
}

const mapPOGStatusToActionQueueStatus = (pogStatus?: POGArtifactContentStatus): ActionQueuesActionItemStatus => {
  if (!pogStatus) return 'queued';
  switch (pogStatus) {
    case 'brainstorm': return 'brainstorm';
    case 'delivered': return 'closed';
    case 'closed': return 'closed';
    case 'offered': return 'active';
    case 'queued': return 'queued';
    default: return 'queued';
  }
};

const mapAskStatusToActionQueueStatus = (askStatus?: AskArtifactContentStatus): ActionQueuesActionItemStatus => {
  if (!askStatus) return 'queued';
  switch (askStatus) {
    case 'received': return 'closed';
    case 'closed': return 'closed';
    case 'in_progress': return 'active';
    case 'requested': return 'active';
    case 'queued': return 'queued';
    default: return 'queued';
  }
};

const ContactProfilePage: React.FC<ContactProfilePageProps> = () => {
  const params = useParams();
  const contactId = params.id as string;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // State for the new Voice Memo Detail Modal
  const [selectedVoiceMemoForDetail, setSelectedVoiceMemoForDetail] = useState<VoiceMemoArtifact | null>(null);
  const [isVoiceMemoDetailModalOpen, setIsVoiceMemoDetailModalOpen] = useState(false);

  // State for the general ArtifactModal
  const [selectedArtifactForModal, setSelectedArtifactForModal] = useState<ArtifactGlobal | null>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  // Add loading states for modal actions
  const [isReprocessingMemo, setIsReprocessingMemo] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { 
    contact, 
    isLoading: isLoadingContact,
    error: contactError,
  } = useContactProfile(contactId);

  const { 
    voiceMemos, 
    isLoading: isLoadingVoiceMemos,
    isError: isVoiceMemosError, 
    error: voiceMemosError, 
    processingCount,
    getProcessingStatus,
    getProcessingDuration
  } = useVoiceMemos({ contact_id: contactId });

  // Instantiate useArtifactModalData hook
  const {
    artifactDetails,
    relatedSuggestions,
    displayedContactProfileUpdates,
    contactName: artifactModalContactName,
    isLoading: isLoadingArtifactModalData,
    error: artifactModalDataError,
    fetchArtifactData,
    reprocessVoiceMemo,
    isReprocessing: isReprocessingArtifactModal,
    deleteArtifact: deleteArtifactModalFromHook,
    isDeleting,
    playAudio,
  } = useArtifactModalData();

  // Effect to handle opening VoiceMemoDetailModal based on URL query params
  useEffect(() => {
    const artifactIdFromQuery = searchParams.get('artifactView');
    const artifactTypeFromQuery = searchParams.get('artifactType');

    if (artifactTypeFromQuery === 'voice_memo' && artifactIdFromQuery && voiceMemos.length > 0) {
      const memoToOpen = voiceMemos.find(memo => memo.id === artifactIdFromQuery);
      if (memoToOpen && !isVoiceMemoDetailModalOpen) {
        setSelectedVoiceMemoForDetail(memoToOpen);
        setIsVoiceMemoDetailModalOpen(true);
        
        // Clean up URL params after opening modal
        const currentPathname = window.location.pathname;
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('artifactView');
        newSearchParams.delete('artifactType');
        router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });
      }
    }
  }, [searchParams, voiceMemos, router, isVoiceMemoDetailModalOpen]);

  // Instantiate useUpdateSuggestions hook
  const {
    suggestions,
    isLoading: isLoadingSuggestions,
    fetchError: suggestionsError,
    pendingCount,
    highConfidenceCount,
    markAsViewed,
    bulkApply,
    bulkReject,
    isBulkProcessing,
  } = useUpdateSuggestions({ contactId });

  // State for suggestions panel
  const [suggestionsPanelOpen, setSuggestionsPanelOpen] = useState(false);

  const {
    deleteArtifact,
    isDeletingArtifact,
  } = useArtifacts();

  // Memoize computed values to prevent re-renders
  const suggestionPriority = useMemo(() => {
    return highConfidenceCount > 0 ? 'high' : 'medium';
  }, [highConfidenceCount]);

  const personalContextForHeader = useMemo(() => {
    return contact?.personal_context 
      ? contact.personal_context as PersonalContextType 
      : undefined;
  }, [contact?.personal_context]);

  const connectCadenceText = useMemo(() => {
    return contact?.connection_cadence_days 
      ? `Connect every ${contact.connection_cadence_days} days` 
      : undefined;
  }, [contact?.connection_cadence_days]);

  // Use useCallback for event handlers to prevent re-renders
  const handleViewSuggestions = useCallback(() => {
    setSuggestionsPanelOpen(true);
  }, []);

  const handleCloseSuggestionsPanel = useCallback(() => {
    setSuggestionsPanelOpen(false);
  }, []);

  const handleRecordNote = useCallback(() => {
    console.log('Record Note clicked');
  }, []);

  const handleSendPOG = useCallback(() => {
    console.log('Send POG clicked');
  }, []);

  const handleScheduleConnect = useCallback(() => {
    console.log('Schedule Connect clicked');
  }, []);

  const handleUpdateStatus = useCallback((itemId: string, newStatus: ActionQueuesActionItemStatus, type: 'pog' | 'ask') => {
    console.log(`Update ${type} item ${itemId} to ${newStatus}`);
  }, []);

  const handleBrainstormPogs = useCallback(() => {
    console.log('Brainstorm POGs clicked');
  }, []);

  const handleQuickAdd = useCallback((type: string) => {
    console.log(`Quick Add ${type} clicked`);
  }, []);

  const handleQuickAddNote = useCallback(() => handleQuickAdd('note'), [handleQuickAdd]);
  const handleQuickAddMeeting = useCallback(() => handleQuickAdd('meeting'), [handleQuickAdd]);
  const handleQuickAddPOG = useCallback(() => handleQuickAdd('POG'), [handleQuickAdd]);
  const handleQuickAddAsk = useCallback(() => handleQuickAdd('Ask'), [handleQuickAdd]);
  const handleQuickAddMilestone = useCallback(() => handleQuickAdd('milestone'), [handleQuickAdd]);

  const handleApplySuggestions = useCallback(async (suggestionIds: string[], selectedPathsMap: Record<string, string[]>) => {
    await bulkApply({ suggestionIds, selectedPathsMap });
    handleCloseSuggestionsPanel();
  }, [bulkApply, handleCloseSuggestionsPanel]);

  const handleRejectSuggestions = useCallback(async (suggestionIds: string[]) => {
    await bulkReject({ suggestionIds });
    handleCloseSuggestionsPanel();
  }, [bulkReject, handleCloseSuggestionsPanel]);

  const handleMarkAsViewed = useCallback(async (suggestionId: string) => {
    await markAsViewed({ suggestionId });
  }, [markAsViewed]);

  const handleAudioEnded = useCallback(() => {
    setPlayingAudioUrl(null);
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioPlaybackError('Error playing audio.');
    setPlayingAudioUrl(null);
  }, []);

  const handleVoiceRecordingComplete = useCallback((artifact: unknown) => {
    console.log('Voice memo created and processing started:', artifact);
    queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
    queryClient.invalidateQueries({ queryKey: ['artifacts', { contact_id: contactId }] });
  }, [queryClient, contactId]);

  const handleVoiceMemoError = useCallback((error: string) => {
    console.error('Voice memo recording/upload error:', error);
    // Show error notification to user, e.g., using a toast library
    // The component itself shows an error alert.
  }, []);

  // This function will be passed to and used by the VoiceMemoDetailModal
  const playAudioFromModal = useCallback(async (audioFilePath: string) => {
    setAudioPlaybackError(null);
    setPlayingAudioUrl(null); // Reset any existing playback
    try {
      const { data, error } = await supabase.storage
        .from('voice-memos')
        .createSignedUrl(audioFilePath, 60 * 1); // 1 minute signed URL
      
      if (error) throw error;
      if (data?.signedUrl) {
        setPlayingAudioUrl(data.signedUrl); // This will be used by an audio element in the modal
        return data.signedUrl; // Return for direct use if modal handles audio element itself
      } else {
        throw new Error('Failed to get playable URL.');
      }
    } catch (e: unknown) {
      console.error('Error creating signed URL for playback:', e);
      setAudioPlaybackError(e instanceof Error ? e.message : 'Could not play audio.');
      throw e; // Re-throw for modal to handle
    }
  }, []);

  interface ActionItemLike {
    id: string;
    content: string;
    status: ActionQueuesActionItemStatus;
    type: 'pog' | 'ask';
  }
  
  const pogs: ActionItemLike[] = useMemo(() => {
    if (!contact?.artifacts) return [];
    return contact.artifacts
      .filter((art): art is POGArtifact => art.type === 'pog')
      .map((art: POGArtifact): ActionItemLike => {
        return {
          id: art.id,
          content: art.metadata?.description || art.content || 'No description',
          status: mapPOGStatusToActionQueueStatus(art.metadata?.status),
          type: 'pog' as const,
        };
      });
  }, [contact?.artifacts]);
  
  const asks: ActionItemLike[] = useMemo(() => {
    if (!contact?.artifacts) return [];
    return contact.artifacts
      .filter((art): art is AskArtifact => art.type === 'ask')
      .map((art: AskArtifact): ActionItemLike => {
        return {
          id: art.id,
          content: art.metadata?.request_description || art.content || 'No description',
          status: mapAskStatusToActionQueueStatus(art.metadata?.status),
          type: 'ask' as const,
        };
      });
  }, [contact?.artifacts]);

  const handleOpenVoiceMemoDetailModal = useCallback((memo: VoiceMemoArtifact) => {
    setSelectedVoiceMemoForDetail(memo);
    setIsVoiceMemoDetailModalOpen(true);
    setPlayingAudioUrl(null); // Clear any main page audio
    setAudioPlaybackError(null);
  }, []);

  const handleCloseVoiceMemoDetailModal = useCallback(() => {
    setSelectedVoiceMemoForDetail(null);
    setIsVoiceMemoDetailModalOpen(false);
    setPlayingAudioUrl(null); 
    setAudioPlaybackError(null);

    // Also ensure URL params are cleared if modal is closed manually
    const artifactIdFromQuery = searchParams.get('artifactView');
    if (artifactIdFromQuery) {
      const currentPathname = window.location.pathname;
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('artifactView');
      newSearchParams.delete('artifactType');
      router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  const handleDeleteVoiceMemoFromDetailModal = useCallback(async (memoId: string) => {
    if (window.confirm('Are you sure you want to delete this voice memo?')) {
      try {
        // Correctly call deleteArtifact from useArtifacts hook
        await deleteArtifact({ id: memoId, contactId: contactId }); 
        showToast('Voice memo deleted successfully', 'success');
        setIsVoiceMemoDetailModalOpen(false); // Close modal after delete
        setSelectedVoiceMemoForDetail(null);
        // Invalidate queries for voice memos or general artifacts for this contact
        queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
        queryClient.invalidateQueries({ queryKey: ['artifacts', { contact_id: contactId }] }); // From useArtifacts key
        queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] });
      } catch (error: unknown) {
         // Check for specific error code if deleteArtifact from useArtifacts provides it
        if (error instanceof Error && (error as any).code === 'ARTIFACT_IS_SOURCE') {
          showToast('Cannot delete: This voice memo is a source for contact profile data.', 'error');
        } else if (error instanceof Error) {
          showToast(`Error deleting: ${error.message}`, 'error');
        } else {
          showToast('An unknown error occurred during deletion.', 'error');
        }
      }
    }
  }, [deleteArtifact, contactId, showToast, queryClient]); // Added queryClient to dependencies

  const handleReprocessVoiceMemoInDetailModal = useCallback(async (memoId: string) => {
    setIsReprocessingMemo(true);
    try {
      await reprocessVoiceMemo(memoId); 
      showToast('Reprocessing started', 'success');
      queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
      queryClient.invalidateQueries({ queryKey: ['artifactDetail', memoId] });
      queryClient.invalidateQueries({ queryKey: ['relatedSuggestions', memoId] });
      if (selectedVoiceMemoForDetail?.id === memoId) {
        const { data: updatedMemo } = await supabase.from('artifacts').select('*').eq('id', memoId).single();
        if (updatedMemo) setSelectedVoiceMemoForDetail(updatedMemo as VoiceMemoArtifact);
      }
    } catch (error: unknown) { 
      if (error instanceof Error) {
        showToast(`Error reprocessing: ${error.message}`, 'error');
      } else {
        showToast('An unknown error occurred during reprocessing.', 'error');
      }
    }
    finally { setIsReprocessingMemo(false); }
  }, [reprocessVoiceMemo, showToast, queryClient, contactId, selectedVoiceMemoForDetail?.id]);

  // Real-time completion/failure notifications
  useEffect(() => {
    if (!contactId || !supabase) return;

    const channel = supabase
      .channel(`db_artifacts_contact_${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artifacts',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          const oldData = payload.old as VoiceMemoArtifact | undefined;
          const newData = payload.new as VoiceMemoArtifact;

          if (newData.type === 'voice_memo') {
            const oldStatus = oldData?.ai_parsing_status;
            const newStatus = newData.ai_parsing_status;

            // Check if AI parsing just completed
            if (oldStatus !== 'completed' && newStatus === 'completed') {
              showToast(
                `Voice memo analysis complete for ${contact?.name || 'contact'}! New suggestions may be available.`,
                'success',
                { icon: "✨", duration: 6000 }
              );
            }
            // Check if AI parsing just failed
            else if (oldStatus !== 'failed' && newStatus === 'failed') {
              showToast(
                `Voice memo analysis failed for ${contact?.name || 'contact'}. Try reprocessing.`,
                'error',
                { icon: "⚠️", duration: 8000 }
              );
            }
            // Query invalidation is handled by useVoiceMemos hook itself
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to artifact updates for contact: ${contactId}`);
        }
        if (err) {
          console.error(`Error subscribing to artifact updates for ${contactId}:`, err);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(err => console.error('Error removing channel:', err));
      }
    };
  }, [contactId, contact?.name, showToast, supabase]); // Added supabase to dependencies

  // Artifact Modal Handlers
  const handleArtifactClick = useCallback((artifact: ArtifactGlobal) => {
    setSelectedArtifactForModal(artifact); // Store the initially clicked artifact for quick display
    fetchArtifactData(artifact.id, contactId); // Fetch full details and related data
    setIsArtifactModalOpen(true);
    setPlayingAudioUrl(null); 
    setAudioPlaybackError(null);
  }, [fetchArtifactData, contactId]);

  const handleCloseArtifactModal = useCallback(() => {
    setIsArtifactModalOpen(false);
    setSelectedArtifactForModal(null); 
    // Optionally clear artifactId in useArtifactModalData if it helps reset state
  }, []);

  const handleDeleteArtifactInModal = useCallback(async (artifactId: string) => {
    try {
      await deleteArtifactModalFromHook(artifactId, contactId);
      showToast('Artifact deleted successfully.', 'success');
      handleCloseArtifactModal(); // Close modal on success
      queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] }); // Refresh timeline
    } catch (error: unknown) {
      console.error('Failed to delete artifact:', error);
      if (error instanceof Error) {
        showToast(`Error deleting artifact: ${error.message}`, 'error');
      } else {
        showToast('An unknown error occurred while deleting the artifact.', 'error');
      }
      // Error will also be available via artifactModalDataError in the modal
    }
  }, [deleteArtifactModalFromHook, contactId, showToast, handleCloseArtifactModal, queryClient]);

  const handleReprocessArtifactInModal = useCallback(async (artifactId: string) => {
    try {
      await reprocessVoiceMemo(artifactId);
      showToast('Artifact reprocessing started.', 'success');
      // Data will refresh via useArtifactModalData hook's internal invalidations
    } catch (error: unknown) {
      console.error('Failed to reprocess artifact:', error);
      if (error instanceof Error) {
        showToast(`Error reprocessing artifact: ${error.message}`, 'error');
      } else {
        showToast('An unknown error occurred while reprocessing the artifact.', 'error');
      }
    }
  }, [reprocessVoiceMemo, showToast]);

  const handlePlayAudioInModal = useCallback(async (audioPath: string): Promise<string> => {
    setAudioPlaybackError(null);
    try {
      const url = await playAudio(audioPath);
      // The modal will handle setting its own audioUrl state
      return url;
    } catch (err: unknown) {
      console.error('Failed to play audio from modal:', err);
      setAudioPlaybackError(err instanceof Error ? err.message : 'Failed to play audio');
      throw err; // Re-throw for modal to handle if needed
    }
  }, [playAudio]);

  // All hooks have been called. Now we can have conditional returns.
  const isLoading = isLoadingContact || isLoadingVoiceMemos || isLoadingSuggestions || isLoadingArtifactModalData;

  if (isLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }

  if (contactError) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{(contactError as Error).message || "Failed to load contact information."}</Alert></Container>;
  }

  if (suggestionsError) {
    console.error("Error fetching suggestions:", suggestionsError);
  }

  if (!contact) {
    return <Container sx={{ py: 4 }}><Alert severity="warning">Contact not found.</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {isLoadingContact && <CircularProgress />}
      {contactError && <Alert severity="error">Failed to load contact details: {(contactError as Error).message}</Alert>}
      
      {contact && (
        <Box>
          <ContactHeader 
            name={contact.name || 'Unnamed Contact'}
            title={contact.title}
            company={contact.company}
            connectCadence={connectCadenceText}
            connectDate={contact.last_interaction_date ? new Date(contact.last_interaction_date) : undefined}
            personalContext={personalContextForHeader}
            profilePhotoUrl={(contact.linkedin_data as unknown as LinkedInArtifactContent)?.profilePicture || undefined}
            location={contact.location}
            relationshipScore={contact.relationship_score}
          />

          <ProcessingStatusBar 
            activeProcessingCount={processingCount} 
            contactName={contact.name || undefined} 
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NextConnection 
                contactId={contactId} 
              />
              
              <ActionQueues 
                pogs={pogs}
                asks={asks}
                onUpdateStatus={handleUpdateStatus}
                onBrainstormPogs={handleBrainstormPogs}
              />

              <ReciprocityDashboard 
                outstandingCommitments={undefined}
              />

              {/* Loop System Integration Point */}
              <LoopDashboard 
                contactId={contactId} 
                contactName={contact.name || 'Contact'} 
              />

              <ContextSections 
                contactData={contact}
                contactId={contactId}
              />
            </Box>
            
            <Box sx={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: '70px' }}>
              {isClient && <VoiceRecorder 
                contactId={contactId} 
              />}
              <QuickAdd 
                onAddNote={handleQuickAddNote}
                onAddMeeting={handleQuickAddMeeting}
                onAddPOG={handleQuickAddPOG}
                onAddAsk={handleQuickAddAsk}
                onAddMilestone={handleQuickAddMilestone} 
              />
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={handleViewSuggestions}
                color={suggestionPriority === 'high' ? 'error' : 'primary'}
              >
                View Suggestions ({pendingCount})
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <SuggestionsPanel
        contactId={contactId}
        isOpen={suggestionsPanelOpen}
        onClose={handleCloseSuggestionsPanel}
        suggestions={suggestions || []}
        onApplySuggestions={handleApplySuggestions}
        onRejectSuggestions={handleRejectSuggestions}
        onMarkAsViewed={handleMarkAsViewed}
        isLoading={isLoadingSuggestions || isBulkProcessing}
      />

      <Box sx={{ textAlign: 'center', py: 3, mt: 4, borderTop: 1, borderColor: 'divider'}}>
        <Typography variant="caption" color="text.secondary">
          Data for {contact.name || 'this contact'}. Last updated: {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>

      <ArtifactModal
        artifact={artifactDetails || selectedArtifactForModal}
        open={isArtifactModalOpen}
        onClose={handleCloseArtifactModal}
        contactId={contactId}
        contactName={artifactModalContactName}
        relatedSuggestions={relatedSuggestions}
        contactFieldSources={displayedContactProfileUpdates}
        onDelete={handleDeleteArtifactInModal}
        onReprocess={handleReprocessArtifactInModal}
        onPlayAudio={handlePlayAudioInModal}
        isLoading={isLoadingArtifactModalData}
        isDeleting={isDeleting}
        isReprocessing={isReprocessingArtifactModal}
        error={artifactModalDataError?.message || null}
      />

      {selectedVoiceMemoForDetail && (
        <VoiceMemoDetailModal
          open={isVoiceMemoDetailModalOpen}
          onClose={handleCloseVoiceMemoDetailModal}
          voiceMemo={selectedVoiceMemoForDetail}
          onDelete={handleDeleteVoiceMemoFromDetailModal} 
          onReprocess={handleReprocessVoiceMemoInDetailModal}
          isReprocessing={isReprocessingMemo} 
          contactName={contact?.name || undefined}
          playAudio={playAudio}
          currentPlayingUrl={playingAudioUrl || undefined} 
          audioPlaybackError={audioPlaybackError || undefined}
          processingStatus={getProcessingStatus(selectedVoiceMemoForDetail.id)?.status}
          processingStartTime={getProcessingStatus(selectedVoiceMemoForDetail.id)?.startedAt}
        />
      )}
    </Container>
  );
};

export default ContactProfilePage;