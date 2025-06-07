'use client';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamically rendered

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
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
// Import LoopSuggestions
import { LoopSuggestions } from '@/components/features/loops/LoopSuggestions';

// Import EnhancedLoopModal NEW
import { EnhancedLoopModal } from '@/components/features/loops/EnhancedLoopModal';

// Dynamically import VoiceRecorder
const VoiceRecorder = nextDynamic(() => 
  import('@/components/features/voice-memos/VoiceRecorder').then(mod => mod.VoiceRecorder),
  { 
    ssr: false, 
    loading: () => <CircularProgress size={20} sx={{display: 'block', margin: 'auto'}} /> 
  }
);

// Import new suggestion components
import { FullSuggestionManager } from '@/components/features/suggestions/UnifiedSuggestionManager';
// Placeholder for the new VoiceMemoDetailModal
import { VoiceMemoDetailModal } from '@/components/features/voice/VoiceMemoDetailModal'; // Uncommented

// Import MeetingManager for Phase V integration
import { MeetingManager } from '@/components/features/meetings/MeetingManager';

// Import ContactEmailManagement for email management
import { ContactEmailManagement } from '@/components/features/contacts/ContactEmailManagement';

// Import hooks and types
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import { useVoiceMemos } from '@/lib/hooks/useVoiceMemos';
// Import useUpdateSuggestions hook for priority calculation only
import { useUpdateSuggestions } from '@/lib/hooks/useUpdateSuggestions';
import { useArtifacts } from '@/lib/hooks/useArtifacts';
import { useArtifactModalData } from '@/lib/hooks/useArtifactModalData';
import type { 
    BaseArtifact,
    POGArtifactContentStatus,
    AskArtifactContentStatus,
    PersonalContext as PersonalContextType,
    VoiceMemoArtifact,
    POGArtifact,
    AskArtifact,
    LinkedInArtifactContent,
    LoopArtifact,
    LoopStatus,
    LoopArtifactContent
} from '@/types';
import { useToast } from '@/lib/contexts/ToastContext';
import { ProcessingStatusBar } from '@/components/features/voice/ProcessingStatusBar'; // Revert to alias import

interface ContactProfilePageProps {
  // Props interface for future use
  params?: Record<string, string>;
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
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);

  // Add loading states for modal actions
  const [isReprocessingMemo, setIsReprocessingMemo] = useState(false);

  // NEW state for EnhancedLoopModal
  const [selectedLoopForEnhancedModal, setSelectedLoopForEnhancedModal] = useState<LoopArtifact | null>(null);
  const [isEnhancedLoopModalOpen, setIsEnhancedLoopModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { 
    contact, 
    isLoading: isLoadingContact,
    error: contactError,
  } = useContactProfile(contactId);

  // Explicitly type contactProfileError to help TypeScript
  const contactProfileError: Error | null = contactError as (Error | null);

  const { 
    voiceMemos, 
    isLoading: isLoadingVoiceMemos,
    processingCount,
    getProcessingStatus
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

  // Calculate suggestion priority for UI components
  const { pendingCount, highConfidenceCount } = useUpdateSuggestions({ contactId });

  const {
    deleteArtifact,
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
        if (error instanceof Error && (error as Error & { code?: string }).code === 'ARTIFACT_IS_SOURCE') {
          showToast('Cannot delete: This voice memo is a source for contact profile data.', 'error');
        } else if (error instanceof Error) {
          showToast(`Error deleting: ${error.message}`, 'error');
        } else {
          showToast('An unknown error occurred during deletion.', 'error');
        }
      }
    }
  }, [deleteArtifact, contactId, showToast, queryClient]);

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

  const handleOpenArtifactModal = useCallback((artifact: BaseArtifact) => {
    if (artifact.type === 'loop') {
      setSelectedLoopForEnhancedModal(artifact as LoopArtifact);
      setIsEnhancedLoopModalOpen(true);
      setIsArtifactModalOpen(false);
    } else if (artifact.type === 'voice_memo') {
        setSelectedVoiceMemoForDetail(artifact as VoiceMemoArtifact);
        setIsVoiceMemoDetailModalOpen(true);
        setIsArtifactModalOpen(false);
    } else {
      fetchArtifactData(artifact.id, contactId);
      setIsArtifactModalOpen(true);
      setSelectedLoopForEnhancedModal(null);
      setIsEnhancedLoopModalOpen(false);
    }
  }, [fetchArtifactData, contactId]);

  // ... (useEffect for artifactView query param needs to be aware of handleOpenArtifactModal)
  useEffect(() => {
    const artifactIdFromQuery = searchParams.get('artifactView');
    const artifactTypeFromQuery = searchParams.get('artifactType') as BaseArtifact['type'] | null;

    if (artifactIdFromQuery && artifactTypeFromQuery && contactId) {
      console.log(`Attempting to open artifact from URL: ID=${artifactIdFromQuery}, Type=${artifactTypeFromQuery}`);
      const placeholderArtifact: BaseArtifact = {
          id: artifactIdFromQuery,
          type: artifactTypeFromQuery,
          contact_id: contactId,
          user_id: 'placeholder_user_id', // Ensure this is present
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(), // Ensure this is present
          updated_at: new Date().toISOString(), // Ensure this is present
          content: {}, 
      };
      handleOpenArtifactModal(placeholderArtifact);
        
      const currentPathname = window.location.pathname;
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('artifactView');
      newSearchParams.delete('artifactType');
      router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, contactId, handleOpenArtifactModal, router]);

  // Placeholder handlers for EnhancedLoopModal props
  // These would ideally interact with a useLoops hook instance available in this scope
  // or be passed down from a higher-level state management for loops.
  const handleLoopStatusUpdate = useCallback((loopId: string, newStatus: LoopStatus) => {
    console.log(`ContactProfilePage: Update status for loop ${loopId} to ${newStatus}`);
    // Example: get loops hook and call updateLoopStatus({loopId, newStatus})
    // queryClient.invalidateQueries(['loops', contactId]); // Example invalidation
  }, []);

  const handleEditLoopDetails = useCallback((loopId: string, updates: Partial<LoopArtifactContent>) => {
    console.log(`ContactProfilePage: Edit details for loop ${loopId}`, updates);
    // Open an edit modal or form - perhaps reuse EnhancedCreateLoopModal with initialData
  }, []);

  const handleDeleteLoop = useCallback((loopId: string) => {
    console.log(`ContactProfilePage: Delete loop ${loopId}`);
    // Example: deleteLoop({loopId})
    // queryClient.invalidateQueries(['loops', contactId]);
    setIsEnhancedLoopModalOpen(false); // Close modal after delete
  }, []);

  const handleShareLoopWithContact = useCallback((loopId: string) => {
    console.log(`ContactProfilePage: Share loop ${loopId} with contact`);
    // Implement sharing logic
  }, []);

  const handleCompleteLoop = useCallback((loopId: string, outcome: Partial<Pick<LoopArtifactContent, 'outcome' | 'satisfaction_score' | 'lessons_learned'>>) => {
    console.log(`ContactProfilePage: Complete loop ${loopId} with outcome`, outcome);
    // Example: completeLoop({loopId, ...outcome })
    // queryClient.invalidateQueries(['loops', contactId]);
  }, []);

  // Real-time completion/failure notifications
  useEffect(() => {
    if (!contactId) return;

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
  }, [contactId, contact?.name, showToast]);

  // All hooks have been called. Now we can have conditional returns.
  const isLoading = isLoadingContact || isLoadingVoiceMemos || isLoadingArtifactModalData;

  if (isLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }

  if (contactProfileError) {
    return <Alert severity="error">Error loading contact: {contactProfileError.message || 'An unexpected error occurred.'}</Alert>;
  }

  if (!contact) {
    return <Container sx={{ py: 4 }}><Alert severity="warning">Contact not found.</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box>
        <ContactHeader 
          name={contact.name || 'Unnamed Contact'}
          title={contact.title}
          company={contact.company}
          email={contact.email}
          connectCadence={connectCadenceText}
          connectDate={contact.last_interaction_date ? new Date(contact.last_interaction_date) : undefined}
          personalContext={personalContextForHeader}
          profilePhotoUrl={(contact.linkedin_data as unknown as LinkedInArtifactContent)?.profilePicture || undefined}
          location={contact.location}
          relationshipScore={contact.relationship_score}
          contactId={contactId}
          suggestionPriority={suggestionPriority}
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
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                Loop Management
              </Typography>
              {/* AI Loop Suggestions */}
              <LoopSuggestions contactId={contactId} />
              {/* Existing Loop Dashboard */}
              <LoopDashboard contactId={contactId} contactName={contact.name || 'Contact'} />
            </Box>

            {/* Meeting Intelligence Integration Point */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                Meeting Intelligence
              </Typography>
              <MeetingManager 
                contactId={contactId}
                limit={10}
                includeUpcoming={true}
                showAsCards={true}
              />
            </Box>

            {/* Email Management Integration Point */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                Email Management
              </Typography>
              <ContactEmailManagement 
                contactId={contactId}
                contactName={contact.name || undefined}
              />
            </Box>

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
            <FullSuggestionManager
              contactId={contactId}
              priority={suggestionPriority}
            />
          </Box>
        </Box>
      </Box>



      <Box sx={{ textAlign: 'center', py: 3, mt: 4, borderTop: 1, borderColor: 'divider'}}>
        <Typography variant="caption" color="text.secondary">
          Data for {contact.name || 'this contact'}. Last updated: {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>

      {isClient && artifactDetails && (
        <ArtifactModal
          artifact={artifactDetails}
          open={isArtifactModalOpen}
          onClose={() => {
            setIsArtifactModalOpen(false);
          }}
          contactId={contactId}
          contactName={artifactModalContactName}
          relatedSuggestions={relatedSuggestions}
          contactFieldSources={displayedContactProfileUpdates}
          onDelete={async (artifactId: string) => {
            await deleteArtifactModalFromHook(artifactId, contactId);
            showToast('Artifact deleted successfully.', 'success');
            setIsArtifactModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] });
          }}
          onReprocess={async (artifactId: string) => {
            await reprocessVoiceMemo(artifactId);
            showToast('Artifact reprocessing started.', 'success');
          }}
          onPlayAudio={(audioPath: string): Promise<string> => {
            setAudioPlaybackError(null);
            return playAudio(audioPath);
          }}
          isLoading={isLoadingArtifactModalData}
          isDeleting={isDeleting}
          isReprocessing={isReprocessingArtifactModal}
          error={artifactModalDataError?.message || null}
        />
      )}

      {selectedVoiceMemoForDetail && (
        <VoiceMemoDetailModal
          open={isVoiceMemoDetailModalOpen}
          onClose={handleCloseVoiceMemoDetailModal}
          voiceMemo={selectedVoiceMemoForDetail}
          onDelete={handleDeleteVoiceMemoFromDetailModal} 
          onReprocess={handleReprocessVoiceMemoInDetailModal}
          isReprocessing={isReprocessingMemo} 
          contactName={contact.name || undefined}
          contactId={contactId}
          playAudio={playAudio}
          currentPlayingUrl={playingAudioUrl || undefined} 
          audioPlaybackError={audioPlaybackError || undefined}
          processingStatus={getProcessingStatus(selectedVoiceMemoForDetail.id)?.status}
          processingStartTime={getProcessingStatus(selectedVoiceMemoForDetail.id)?.startedAt}
        />
      )}

      {isClient && (
        <EnhancedLoopModal
          open={isEnhancedLoopModalOpen}
          onClose={() => setIsEnhancedLoopModalOpen(false)}
          artifact={selectedLoopForEnhancedModal}
          contactName={contact?.name || 'Contact'}
          onStatusUpdate={handleLoopStatusUpdate}
          onEdit={handleEditLoopDetails}
          onDelete={handleDeleteLoop}
          onShare={handleShareLoopWithContact}
          onComplete={handleCompleteLoop}
        />
      )}
    </Container>
  );
};

export default ContactProfilePage;