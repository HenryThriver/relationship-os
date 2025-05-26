'use client';

export const dynamic = 'force-dynamic'; // Ensures the page is always dynamically rendered

import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, Alert, List, ListItem, ListItemText, IconButton, ListItemButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { default as nextDynamic } from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';

// Import actual components
import { ContactHeader } from '@/components/features/contacts/ContactHeader';
import { NextConnection } from '@/components/features/contacts/NextConnection';
import { ActionQueues, ActionItemStatus as ActionQueuesActionItemStatus } from '@/components/features/contacts/ActionQueues';
import { ReciprocityDashboard, ExchangeItem } from '@/components/features/contacts/ReciprocityDashboard';
import { ContextSections } from '@/components/features/contacts/ContextSections';
import { QuickAdd } from '@/components/features/contacts/QuickAdd';

// Dynamically import VoiceRecorder
const VoiceRecorder = nextDynamic(() => 
  import('@/components/features/voice-memos/VoiceRecorder').then(mod => mod.VoiceRecorder),
  { 
    ssr: false, 
    loading: () => <CircularProgress size={20} sx={{display: 'block', margin: 'auto'}} /> 
  }
);

// Import UpdateSuggestionsModal
import { UpdateSuggestionsModal } from '@/components/features/voice/UpdateSuggestionsModal';
// Placeholder for the new VoiceMemoDetailModal
import { VoiceMemoDetailModal } from '@/components/features/voice/VoiceMemoDetailModal'; // Uncommented

// Import hooks and types
import { useContactProfile } from '@/lib/hooks/useContactProfile';
import { useVoiceMemos } from '@/lib/hooks/useVoiceMemos';
// Import useUpdateSuggestions hook
import { useUpdateSuggestions } from '@/lib/hooks/useUpdateSuggestions';
import { useArtifacts } from '@/lib/hooks/useArtifacts';
import { Database } from '@/lib/supabase/types_db';
import type { 
    Contact, 
    ArtifactGlobal,
    POGArtifactContent,
    AskArtifactContent,
    POGArtifactContentStatus,
    AskArtifactContentStatus,
    PersonalContext as PersonalContextType,
    VoiceMemoArtifact
} from '@/types';

interface ContactProfilePageProps {}

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

  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // State for the new Voice Memo Detail Modal
  const [selectedVoiceMemoForDetail, setSelectedVoiceMemoForDetail] = useState<VoiceMemoArtifact | null>(null);
  const [isVoiceMemoDetailModalOpen, setIsVoiceMemoDetailModalOpen] = useState(false);

  // Add loading states for modal actions
  const [isReprocessingMemo, setIsReprocessingMemo] = useState(false);
  const [deleteErrorAlert, setDeleteErrorAlert] = useState<string | null>(null);

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
    error: voiceMemosError 
  } = useVoiceMemos({ contact_id: contactId });

  // Instantiate useUpdateSuggestions hook
  const {
    suggestions,
    isLoading: isLoadingSuggestions,
    fetchError: suggestionsError,
    showModal: showSuggestionsModal,
    setShowModal: setShowSuggestionsModal,
    applySuggestion,
    isApplyingSuggestion,
    rejectSuggestion,
    isRejectingSuggestion,
  } = useUpdateSuggestions({ contactId });

  const {
    deleteArtifact,
    isDeletingArtifact,
  } = useArtifacts();

  const isLoading = isLoadingContact || isLoadingVoiceMemos || isLoadingSuggestions;

  if (isLoading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
  }

  if (contactError) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{contactError.message || "Failed to load contact information."}</Alert></Container>;
  }

  if (suggestionsError) {
    console.error("Error fetching suggestions:", suggestionsError);
  }

  if (!contact) {
    return <Container sx={{ py: 4 }}><Alert severity="warning">Contact not found.</Alert></Container>;
  }

  const personalContextForHeader = contact.personal_context 
    ? contact.personal_context as PersonalContextType 
    : undefined;
  
  // Find the first pending suggestion record to display in the modal
  const currentSuggestionRecord = suggestions.find(s => s.status === 'pending');

  interface ActionItemLike {
    id: string;
    content: string;
    status: ActionQueuesActionItemStatus;
    type: 'pog' | 'ask';
  }
  
  const pogs: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'pog')
    .map((art: ArtifactGlobal): ActionItemLike => {
      const metadata = art.metadata as POGArtifactContent | undefined;
      return {
        id: art.id,
        content: metadata?.description || art.content,
        status: mapPOGStatusToActionQueueStatus(metadata?.status),
        type: 'pog' as const,
      };
    }) || [];
  
  const asks: ActionItemLike[] = contact.artifacts
    ?.filter(art => art.type === 'ask')
    .map((art: ArtifactGlobal): ActionItemLike => {
      const metadata = art.metadata as AskArtifactContent | undefined;
      return {
        id: art.id,
        content: metadata?.request_description || art.content,
        status: mapAskStatusToActionQueueStatus(metadata?.status),
        type: 'ask' as const,
      };
    }) || [];

  const handleRecordNote = () => console.log('Record Note clicked');
  const handleSendPOG = () => console.log('Send POG clicked');
  const handleScheduleConnect = () => console.log('Schedule Connect clicked');
  const handleUpdateStatus = (itemId: string, newStatus: ActionQueuesActionItemStatus, type: 'pog' | 'ask') => {
    console.log(`Update ${type} item ${itemId} to ${newStatus}`);
  };
  const handleBrainstormPogs = () => console.log('Brainstorm POGs clicked');
  const handleQuickAdd = (type: string) => console.log(`Quick Add ${type} clicked`);

  const handleVoiceRecordingComplete = (artifact: any) => {
    console.log('Voice memo created and processing started:', artifact);
    queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
    queryClient.invalidateQueries({ queryKey: ['artifacts', { contact_id: contactId }] });
  };

  const handleVoiceMemoError = (error: string) => {
    console.error('Voice memo recording/upload error:', error);
    // Show error notification to user, e.g., using a toast library
    // The component itself shows an error alert.
  };

  // This function will be passed to and used by the VoiceMemoDetailModal
  const playAudioFromModal = async (audioFilePath: string) => {
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
    } catch (e: any) {
      console.error('Error creating signed URL for playback:', e);
      setAudioPlaybackError(e.message || 'Could not play audio.');
      throw e; // Re-throw for modal to handle
    }
  };
  
  const handleOpenVoiceMemoDetailModal = (memo: VoiceMemoArtifact) => {
    setSelectedVoiceMemoForDetail(memo);
    setIsVoiceMemoDetailModalOpen(true);
    setPlayingAudioUrl(null); // Clear any main page audio
    setAudioPlaybackError(null);
  };

  const handleCloseVoiceMemoDetailModal = () => {
    setSelectedVoiceMemoForDetail(null);
    setIsVoiceMemoDetailModalOpen(false);
    setPlayingAudioUrl(null); // Clear audio when modal closes
    setAudioPlaybackError(null);
  };

  const handleDeleteVoiceMemo = async (artifactId: string) => {
    if (!selectedVoiceMemoForDetail) {
      setDeleteErrorAlert('No voice memo selected for deletion.');
      return;
    }
    setDeleteErrorAlert(null);

    try {
      await deleteArtifact({
        id: artifactId,
        contactId: selectedVoiceMemoForDetail.contact_id,
      });
      console.log('Voice memo deleted successfully');
      handleCloseVoiceMemoDetailModal();
      queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
    } catch (error: any) {
      console.error('Failed to delete voice memo:', error);
      const message = error.code === 'ARTIFACT_IS_SOURCE' 
          ? error.message 
          : 'Failed to delete voice memo. Please try again.';
      setDeleteErrorAlert(message);
    }
  };

  const handleReprocessAi = async (artifactId: string) => {
    setIsReprocessingMemo(true);
    setAudioPlaybackError(null);
    try {
      const response = await fetch(`/api/voice-memo/${artifactId}/reprocess`, {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reprocess AI.');
      }
      console.log('AI Reprocessing started');
      queryClient.invalidateQueries({ queryKey: ['voiceMemos', contactId] });
      queryClient.invalidateQueries({ queryKey: ['artifacts', { contact_id: contactId }] });
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
      handleCloseVoiceMemoDetailModal();
    } catch (error: any) {
      console.error('Error reprocessing AI:', error);
      setAudioPlaybackError(error.message || 'Error reprocessing AI.');
    } finally {
      setIsReprocessingMemo(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#f3f4f6' }}>
      <Box sx={{ position: 'sticky', top: { xs: 56, sm: 64, md: 0 }, zIndex: 10, backgroundColor: '#f3f4f6', pb: 1, mb:1 }}>
        <ContactHeader 
          name={contact.name}
          title={contact.title}
          company={contact.company}
          location={contact.location}
          profilePhotoUrl={contact.profile_photo_url}
          relationshipScore={contact.relationship_score}
          userGoal={personalContextForHeader?.relationship_goal}
          connectCadence={contact.connection_cadence_days ? `Connect every ${contact.connection_cadence_days} days` : undefined}
          onRecordNote={handleRecordNote}
          onSendPOG={handleSendPOG}
          onScheduleConnect={handleScheduleConnect}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flexGrow: 1, flexBasis: { md: '66%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NextConnection contactId={contactId} /> 
          <ActionQueues 
            pogs={pogs}
            asks={asks}
            onUpdateStatus={handleUpdateStatus}
            onBrainstormPogs={handleBrainstormPogs}
          />
          
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Voice Memos</Typography>
            <Box mb={2}>
              {isClient ? (
                <VoiceRecorder 
                  contactId={contactId} 
                  onRecordingComplete={handleVoiceRecordingComplete} 
                  onError={handleVoiceMemoError} 
                />
              ) : (
                <CircularProgress size={20} sx={{display: 'block', margin: 'auto'}} /> 
              )}
            </Box>
            {isLoadingVoiceMemos && <CircularProgress size={20} />}
            {isVoiceMemosError && <Alert severity="error">Error loading voice memos: {voiceMemosError?.message}</Alert>}
            {audioPlaybackError && <Alert severity="error" sx={{mt: 1}}>{audioPlaybackError}</Alert>}
            {playingAudioUrl && (
              <Box mt={2} mb={1}>
                <audio controls autoPlay src={playingAudioUrl} onEnded={() => setPlayingAudioUrl(null)} onError={() => {setAudioPlaybackError('Error playing audio.'); setPlayingAudioUrl(null);}}>
                  Your browser does not support the audio element.
                </audio>
              </Box>
            )}
            {!isLoadingVoiceMemos && !isVoiceMemosError && voiceMemos.length === 0 && (
              <Typography variant="body2" color="text.secondary">No voice memos recorded yet.</Typography>
            )}
            {!isLoadingVoiceMemos && !isVoiceMemosError && voiceMemos.length > 0 && (
              <List dense>
                {voiceMemos.map((memo: VoiceMemoArtifact) => (
                  <ListItemButton 
                    key={memo.id} 
                    onClick={() => handleOpenVoiceMemoDetailModal(memo)}
                    divider
                  >
                    <ListItemText 
                      primary={`Recorded: ${new Date(memo.created_at).toLocaleString()}`}
                      secondary={memo.transcription_status === 'completed' ? (memo.content || memo.transcription || 'Processed').substring(0,100)+'...' : `Status: ${memo.transcription_status}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
          
          <ReciprocityDashboard 
            balance={undefined}
            healthIndex={undefined}
            status={undefined}
            recentExchanges={undefined}
            outstandingCommitments={undefined}
          />
        </Box>

        <Box sx={{ flexGrow: 1, flexBasis: { md: '33%' } }}>
          <ContextSections contactData={contact} /> 
        </Box>
      </Box>
      
      <QuickAdd 
        onAddNote={() => handleQuickAdd('note')}
        onAddMeeting={() => handleQuickAdd('meeting')}
        onAddPOG={() => handleQuickAdd('POG')}
        onAddAsk={() => handleQuickAdd('Ask')}
        onAddMilestone={() => handleQuickAdd('milestone')}
      />
      <Box sx={{ textAlign: 'center', py: 3, mt: 4, borderTop: 1, borderColor: 'divider'}}>
        <Typography variant="caption" color="text.secondary">
          Data for {contact.name || 'this contact'}. Last updated: {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </Box>

      {/* Render UpdateSuggestionsModal */}
      {showSuggestionsModal && currentSuggestionRecord && (
        <UpdateSuggestionsModal
          open={showSuggestionsModal}
          onClose={() => setShowSuggestionsModal(false)}
          suggestions={currentSuggestionRecord.suggested_updates.suggestions}
          suggestionRecordId={currentSuggestionRecord.id}
          contactName={contact.name || 'this contact'}
          onApprove={async (suggestionRecordId: string, selectedPaths: string[]) => {
            try {
              await applySuggestion({ suggestionId: suggestionRecordId, selectedPaths });
            } catch (error) {
              console.error("Error applying suggestion:", error);
            }
          }}
          onReject={async (suggestionRecordId: string) => {
            try {
              await rejectSuggestion({ suggestionId: suggestionRecordId });
            } catch (error) {
              console.error("Error rejecting suggestion:", error);
            }
          }}
          isLoading={isApplyingSuggestion || isRejectingSuggestion} // Combined loading state for modal
          transcriptionText={
            currentSuggestionRecord.artifacts?.transcription 
              ? String(currentSuggestionRecord.artifacts.transcription) 
              : "Transcription not available."
          }
        />
      )}

      {/* Placeholder for VoiceMemoDetailModal - to be created next */}
      {selectedVoiceMemoForDetail && (
        <VoiceMemoDetailModal
          open={isVoiceMemoDetailModalOpen}
          onClose={handleCloseVoiceMemoDetailModal}
          voiceMemo={selectedVoiceMemoForDetail}
          playAudio={playAudioFromModal}
          onDelete={handleDeleteVoiceMemo}
          onReprocess={handleReprocessAi}
          isDeleting={isDeletingArtifact}
          isReprocessing={isReprocessingMemo}
          audioPlaybackError={audioPlaybackError}
          currentPlayingUrl={playingAudioUrl}
        />
      )}
    </Container>
  );
};

export default ContactProfilePage;