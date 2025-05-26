import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useSupabaseClient } from '@supabase/auth-helpers-react'; // Replaced for consistency
import { supabase } from '@/lib/supabase/client'; // Using singleton client
import { UpdateSuggestionRecord, ContactUpdateSuggestion } from '@/types/suggestions';
// Ensure Database type is imported if needed for explicit casting, though client should be typed
// import { Database } from '@/lib/supabase/database.types'; 

export interface UseUpdateSuggestionsProps {
  contactId: string | null; // Allow null to prevent query if no contactId
}

// Explicitly define the table name as a literal type
const CONTACT_UPDATE_SUGGESTIONS_TABLE = 'contact_update_suggestions' as const;

export const useUpdateSuggestions = ({ contactId }: UseUpdateSuggestionsProps) => {
  const [showModal, setShowModal] = useState(false);
  // const supabase = useSupabaseClient(); // Replaced
  const queryClient = useQueryClient();

  // Fetch pending suggestions
  const { data: suggestions = [], isLoading, error } = useQuery<UpdateSuggestionRecord[], Error>({
    queryKey: ['update-suggestions', contactId],
    queryFn: async () => {
      if (!contactId) return []; // Do not fetch if contactId is null

      const { data, error: queryError } = await supabase
        .from(CONTACT_UPDATE_SUGGESTIONS_TABLE) // Use const for table name
        .select(`
          *,
          artifacts (transcription, created_at)
        `)
        .eq('contact_id', contactId)
        .eq('status', 'pending') // Only fetch pending suggestions
        .order('created_at', { ascending: false });
      
      if (queryError) {
        console.error('Error fetching update suggestions:', queryError);
        throw queryError;
      }
      // Even with generated types, explicit casting might be needed if the select string complexity
      // outpaces the type inference for `data`.
      // Also, ensure nested JSON fields are correctly typed.
      return data ? data.map(s => ({
        ...s,
        suggested_updates: s.suggested_updates as unknown as { suggestions: ContactUpdateSuggestion[] },
        // Ensure artifacts is handled, it can be null from the query
        artifacts: s.artifacts ? { 
            transcription: s.artifacts.transcription, 
            created_at: s.artifacts.created_at 
        } : undefined 
      })) as UpdateSuggestionRecord[] : []; 
    },
    enabled: !!contactId, // Only run query if contactId is not null/undefined
  });

  // Apply suggestions mutation
  const applyMutation = useMutation<any, Error, { suggestionId: string; selectedPaths: string[] }>({
    mutationFn: async ({ 
      suggestionId, 
      selectedPaths 
    }) => {
      const response = await fetch('/api/suggestions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, selectedPaths })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to apply suggestions' }));
        console.error('Failed to apply suggestions:', errorData);
        throw new Error(errorData.message || 'Failed to apply suggestions');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
      setShowModal(false);
    },
    onError: (err: Error) => { // Explicitly type error object
      console.error('Error in applyMutation:', err);
    }
  });

  // Reject suggestions mutation
  const rejectMutation = useMutation<any, Error, { suggestionId: string }>({
    mutationFn: async ({ suggestionId }) => {
      const { error: updateError } = await supabase
        .from(CONTACT_UPDATE_SUGGESTIONS_TABLE) // Use const for table name
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);
      
      if (updateError) {
        console.error('Error rejecting suggestion:', updateError);
        throw updateError;
      }
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
      setShowModal(false);
    },
    onError: (err: Error) => { // Explicitly type error object
      console.error('Error in rejectMutation:', err);
    }
  });

  // Auto-show modal for new suggestions if there are any pending ones
  // This effect runs when `suggestions` data changes and is not loading.
  useEffect(() => {
    if (!isLoading && suggestions && suggestions.length > 0 && suggestions.some(s => s.status === 'pending')) {
      // Check if modal was already shown for these specific suggestions perhaps?
      // For simplicity, show if any pending exist. Could be refined with local state/storage.
      setShowModal(true);
    }
  }, [suggestions, isLoading]);

  return {
    suggestions,
    isLoading,
    fetchError: error,
    showModal,
    setShowModal,
    applySuggestion: applyMutation.mutateAsync, // Expose mutateAsync for easier promise handling
    isApplyingSuggestion: applyMutation.isPending,
    rejectSuggestion: rejectMutation.mutateAsync,
    isRejectingSuggestion: rejectMutation.isPending,
  };
}; 