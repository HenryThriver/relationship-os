'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { BaseArtifact } from '@/types';
import type { UpdateSuggestionRecord, ContactUpdateSuggestion } from '@/types/suggestions';
import type { Contact } from '@/types/contact';

interface UseArtifactModalDataReturn {
  artifactDetails: BaseArtifact | null;
  relatedSuggestions: UpdateSuggestionRecord[];
  displayedContactProfileUpdates: Record<string, string>;
  contactName?: string;
  contactLinkedInUrl?: string;
  isLoading: boolean;
  error: Error | null;
  fetchArtifactData: (artifactId: string, contactId: string) => void;
  reprocessVoiceMemo: (artifactId: string) => Promise<void>;
  isReprocessing: boolean;
  deleteArtifact: (artifactId: string, contactId?: string) => Promise<void>;
  isDeleting: boolean;
  playAudio: (audioPath: string) => Promise<string>;
}

export const useArtifactModalData = (): UseArtifactModalDataReturn => {
  const queryClient = useQueryClient();
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [currentContactId, setCurrentContactId] = useState<string | null>(null);

  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    data: artifactDetails, 
    isLoading: isLoadingArtifact, 
    error: artifactError 
  } = useQuery<BaseArtifact | null, Error>({
    queryKey: ['artifactDetail', artifactId],
    queryFn: async () => {
      if (!artifactId) return null;
      const { data, error } = await supabase.from('artifacts').select('*').eq('id', artifactId).single();
      
      // --- DEBUG LOG for raw fetched data ---
      if (data) {
        console.log('[useArtifactModalData] Raw fetched data for artifact ID:', artifactId, data);
        if (data.metadata) {
          const metadata = data.metadata as Record<string, unknown>;
          console.log('[useArtifactModalData] Raw metadata.about:', metadata.about);
          console.log('[useArtifactModalData] Raw metadata.experience:', metadata.experience);
          console.log('[useArtifactModalData] Raw metadata.education:', metadata.education);
          console.log('[useArtifactModalData] Raw metadata.skills:', metadata.skills);
          console.log('[useArtifactModalData] All raw metadata keys:', Object.keys(metadata));
        } else {
          console.log('[useArtifactModalData] Raw metadata is null or undefined for artifact ID:', artifactId);
        }
      } else if (error) {
        console.error('[useArtifactModalData] Error fetching artifact:', artifactId, error);
      }
      // --- END DEBUG LOG ---

      if (error) throw error;
      return data as BaseArtifact;
    },
    enabled: !!artifactId,
  });

  const { 
    data: relatedSuggestions, 
    isLoading: isLoadingSuggestions, 
    error: suggestionsError 
  } = useQuery<UpdateSuggestionRecord[], Error>({
    queryKey: ['relatedSuggestions', artifactId],
    queryFn: async () => {
      if (!artifactId) return [];
      const { data, error } = await supabase.from('contact_update_suggestions').select('*').eq('artifact_id', artifactId);
      if (error) throw error;
      return (data || []).map((suggestion: Record<string, unknown>) => ({
        ...suggestion,
        suggested_updates: suggestion.suggested_updates as unknown as { suggestions: ContactUpdateSuggestion[] },
      })) as UpdateSuggestionRecord[];
    },
    enabled: !!artifactId,
  });

  // Fetch contact details (including name and field_sources)
  const { 
    data: contactDataForModal, 
    isLoading: isLoadingContactData, 
    error: contactDataError 
  } = useQuery<Contact | null, Error>({
    queryKey: ['contactDataForModal', currentContactId], 
    queryFn: async () => {
      if (!currentContactId) return null;
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, name, field_sources, linkedin_url')
        .eq('id', currentContactId)
        .single();
      if (contactError) throw contactError;
      return contactData as Contact | null;
    },
    enabled: !!currentContactId, 
  });

  const contactFieldSourcesMap = useMemo(() => {
    return (contactDataForModal?.field_sources as Record<string, string>) || {};
  }, [contactDataForModal]);

  const contactName = useMemo(() => {
    return contactDataForModal?.name;
  }, [contactDataForModal]);

  const contactLinkedInUrl = useMemo(() => {
    return contactDataForModal?.linkedin_url;
  }, [contactDataForModal]);

  const getValueFromPath = useCallback((obj: Record<string, unknown>, path: string): unknown => {
    if (!obj || typeof path !== 'string') return undefined;
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object' && acc !== null) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }, []);

  const displayedContactProfileUpdates = useMemo(() => {
    if (!contactFieldSourcesMap || !artifactId || !artifactDetails) return {};
    const updates: Record<string, string> = {};
    for (const fieldPath in contactFieldSourcesMap) {
      if (contactFieldSourcesMap[fieldPath] === artifactId) {
        let value: unknown = 'Value not directly found';
        let valueFoundFromSuggestion = false;
        if (relatedSuggestions && relatedSuggestions.length > 0) {
          for (const suggestion of relatedSuggestions) {
            if (suggestion.status === 'approved' || suggestion.status === 'partial') {
              for (const s_update of suggestion.suggested_updates.suggestions) {
                if (s_update.field_path === fieldPath) {
                  value = s_update.suggested_value;
                  valueFoundFromSuggestion = true;
                  break;
                } else if (fieldPath.startsWith(s_update.field_path + '.')) {
                  const subPath = fieldPath.substring(s_update.field_path.length + 1);
                  const extractedValue = getValueFromPath(s_update.suggested_value as Record<string, unknown>, subPath);
                  if (extractedValue !== undefined) {
                    value = extractedValue;
                    valueFoundFromSuggestion = true;
                    break;
                  }
                }
              }
            }
            if (valueFoundFromSuggestion) break;
          }
        }
        if (!valueFoundFromSuggestion) {
          if (artifactDetails.metadata && typeof artifactDetails.metadata === 'object') {
            const metaValue = getValueFromPath(artifactDetails.metadata as Record<string, unknown>, fieldPath);
            if (metaValue !== undefined) {
              value = metaValue;
            }
          }
          if (typeof artifactDetails.content === 'string' && fieldPath === 'content') {
            value = artifactDetails.content;
          } else if (typeof artifactDetails.content === 'object' && artifactDetails.content !== null) {
            const contentValue = getValueFromPath(artifactDetails.content as Record<string, unknown>, fieldPath);
            if (contentValue !== undefined) {
              value = contentValue;
            }
          }
        }
        updates[fieldPath] = String(value);
      }
    }
    return updates;
  }, [contactFieldSourcesMap, artifactId, artifactDetails, relatedSuggestions, getValueFromPath]);

  const fetchArtifactData = useCallback((id: string, cId: string) => {
    setArtifactId(id);
    setCurrentContactId(cId);
  }, []);
  
  const reprocessVoiceMemo = useCallback(async (id: string) => {
    setIsReprocessing(true);
    try {
      const response = await fetch(`/api/voice-memo/${id}/reprocess`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reprocess voice memo');
      }
      queryClient.invalidateQueries({ queryKey: ['artifactDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['relatedSuggestions', id] });
      if (currentContactId) {
         queryClient.invalidateQueries({ queryKey: ['artifactTimeline', currentContactId] });
         queryClient.invalidateQueries({ queryKey: ['voiceMemos', currentContactId] });
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      throw error;
    } finally {
      setIsReprocessing(false);
    }
  }, [queryClient, currentContactId]);

  const deleteArtifact = useCallback(async (id: string, artifactContactIdParam?: string) => {
    setIsDeleting(true);
    const finalContactId = artifactContactIdParam || currentContactId;
    try {
      const response = await fetch(`/api/artifacts/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete artifact' }));
        throw new Error(errorData.message);
      }
      queryClient.invalidateQueries({ queryKey: ['artifactDetail', id] });
      queryClient.removeQueries({ queryKey: ['artifactDetail', id] });
      if (finalContactId) {
        queryClient.invalidateQueries({ queryKey: ['artifactTimeline', finalContactId] });
        queryClient.invalidateQueries({ queryKey: ['voiceMemos', finalContactId] });
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [queryClient, currentContactId]);
  
  const playAudio = useCallback(async (audioPath: string): Promise<string> => {
    try {
        const { data, error } = await supabase.storage.from('voice_memos').createSignedUrl(audioPath, 60 * 5);
        if (error) throw new Error('Could not load audio: ' + error.message);
        if (!data?.signedUrl) throw new Error('Could not load audio: Signed URL not generated.');
        return data.signedUrl;
    } catch (err) {
        console.error('Play audio error:', err);
        throw err;
    }
  }, []);

  return {
    artifactDetails: artifactDetails || null,
    relatedSuggestions: relatedSuggestions || [],
    displayedContactProfileUpdates,
    contactName: contactName || undefined,
    contactLinkedInUrl: contactLinkedInUrl || undefined,
    isLoading: isLoadingArtifact || isLoadingSuggestions || isLoadingContactData,
    error: artifactError || suggestionsError || contactDataError,
    fetchArtifactData,
    reprocessVoiceMemo,
    isReprocessing,
    deleteArtifact,
    isDeleting,
    playAudio,
  };
}; 