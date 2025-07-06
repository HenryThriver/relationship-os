import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { MeetingArtifact, MeetingArtifactContent } from '@/types/artifact';

interface UseMeetingModalsReturn {
  // Modal states
  detailModalOpen: boolean;
  contentUploadModalOpen: boolean;
  selectedMeeting: MeetingArtifact | null;
  
  // Modal actions
  openDetailModal: (meeting: MeetingArtifact) => void;
  closeDetailModal: () => void;
  openContentUploadModal: (meeting: MeetingArtifact) => void;
  closeContentUploadModal: () => void;
  
  // Content management
  saveMeetingContent: (contentType: 'notes' | 'transcript' | 'recording', content: string | File) => Promise<void>;
  updateActionItem: (artifactId: string, actionItemId: string, completed: boolean) => Promise<void>;
  applySuggestion: (artifactId: string, suggestionId: string) => Promise<void>;
  
  // Loading states
  saving: boolean;
  error: string | null;
}

export const useMeetingModals = (): UseMeetingModalsReturn => {
  const { user } = useAuth();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [contentUploadModalOpen, setContentUploadModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingArtifact | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDetailModal = useCallback((meeting: MeetingArtifact) => {
    setSelectedMeeting(meeting);
    setDetailModalOpen(true);
    setError(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedMeeting(null);
    setError(null);
  }, []);

  const openContentUploadModal = useCallback((meeting: MeetingArtifact) => {
    setSelectedMeeting(meeting);
    setContentUploadModalOpen(true);
    setError(null);
  }, []);

  const closeContentUploadModal = useCallback(() => {
    setContentUploadModalOpen(false);
    setSelectedMeeting(null);
    setError(null);
  }, []);

  const saveMeetingContent = useCallback(async (
    contentType: 'notes' | 'transcript' | 'recording',
    content: string | File
  ): Promise<void> => {
    if (!selectedMeeting || !user) {
      throw new Error('No meeting selected or user not authenticated');
    }

    setSaving(true);
    setError(null);

    try {
      const contentData: MeetingArtifactContent = { ...(selectedMeeting.content as MeetingArtifactContent) };

      if (contentType === 'recording' && content instanceof File) {
        // Upload file to Supabase Storage
        const fileExt = content.name.split('.').pop();
        const fileName = `${selectedMeeting.id}-recording.${fileExt}`;
        const filePath = `meeting-recordings/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('artifacts')
          .upload(filePath, content, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('artifacts')
          .getPublicUrl(filePath);

        contentData.recording_url = publicUrl;
      } else if (typeof content === 'string') {
        (contentData as unknown as Record<string, unknown>)[contentType] = content;
      }

      // Update the artifact in the database
      const { error: updateError } = await supabase
        .from('artifacts')
        .update({
          content: JSON.stringify(contentData), // Convert to string for database storage
          ai_parsing_status: 'pending', // Trigger AI processing
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMeeting.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setSelectedMeeting(prev => prev ? {
        ...prev,
        content: contentData,
        ai_parsing_status: 'pending'
      } : null);

    } catch (err) {
      console.error('Error saving meeting content:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [selectedMeeting, user]);

  const updateActionItem = useCallback(async (
    artifactId: string,
    actionItemId: string,
    completed: boolean
  ): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get current artifact
      const { data: artifact, error: fetchError } = await supabase
        .from('artifacts')
        .select('content')
        .eq('id', artifactId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Update action item in content
      const content = typeof artifact.content === 'string' 
        ? JSON.parse(artifact.content) as MeetingArtifactContent 
        : artifact.content as MeetingArtifactContent;
      if (content.insights?.actionItems) {
        const actionItems = content.insights.actionItems.map((item: typeof content.insights.actionItems[0]) => 
          (item.id === actionItemId || item.description === actionItemId)
            ? { ...item, completed }
            : item
        );
        content.insights.actionItems = actionItems;
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('artifacts')
        .update({
          content: JSON.stringify(content), // Convert to string for database storage
          updated_at: new Date().toISOString(),
        })
        .eq('id', artifactId);

      if (updateError) {
        throw updateError;
      }

      // Update local state if this is the selected meeting
      if (selectedMeeting?.id === artifactId) {
        setSelectedMeeting(prev => prev ? {
          ...prev,
          content
        } : null);
      }

    } catch (err) {
      console.error('Error updating action item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update action item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, selectedMeeting]);

  const applySuggestion = useCallback(async (
    artifactId: string,
    suggestionId: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Call the suggestions API to apply the suggestion
      const response = await fetch('/api/suggestions/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifactId,
          suggestionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply suggestion');
      }

      // Optionally refresh the meeting data here
      // For now, we'll just show a success message

    } catch (err) {
      console.error('Error applying suggestion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply suggestion';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // const _handleError = (error: Error) => {
  //   console.error('Error:', error);
  //   setError(error.message);
  //   throw error;
  // };

  return {
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
    error,
  };
}; 