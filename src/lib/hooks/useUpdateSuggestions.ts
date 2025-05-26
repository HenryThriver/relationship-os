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
    },
    onError: (err: Error) => { // Explicitly type error object
      console.error('Error in rejectMutation:', err);
    }
  });

  // Mark suggestion as viewed mutation
  const markViewedMutation = useMutation<any, Error, { suggestionId: string }>({
    mutationFn: async ({ suggestionId }) => {
      const { error: updateError } = await supabase
        .from(CONTACT_UPDATE_SUGGESTIONS_TABLE)
        .update({ 
          viewed_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);
      
      if (updateError) {
        console.error('Error marking suggestion as viewed:', updateError);
        throw updateError;
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
    },
    onError: (err: Error) => {
      console.error('Error in markViewedMutation:', err);
    }
  });

  // Bulk apply suggestions mutation
  const bulkApplyMutation = useMutation<any, Error, { suggestionIds: string[]; selectedPathsMap: Record<string, string[]> }>({
    mutationFn: async ({ suggestionIds, selectedPathsMap }) => {
      const promises = suggestionIds.map(suggestionId => 
        fetch('/api/suggestions/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            suggestionId, 
            selectedPaths: selectedPathsMap[suggestionId] || [] 
          })
        })
      );
      
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
    },
    onError: (err: Error) => {
      console.error('Error in bulkApplyMutation:', err);
    }
  });

  // Bulk reject suggestions mutation
  const bulkRejectMutation = useMutation<any, Error, { suggestionIds: string[] }>({
    mutationFn: async ({ suggestionIds }) => {
      const { error: updateError } = await supabase
        .from(CONTACT_UPDATE_SUGGESTIONS_TABLE)
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .in('id', suggestionIds);
      
      if (updateError) {
        console.error('Error bulk rejecting suggestions:', updateError);
        throw updateError;
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-suggestions', contactId] });
    },
    onError: (err: Error) => {
      console.error('Error in bulkRejectMutation:', err);
    }
  });

  // Calculate derived values
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const highConfidenceCount = suggestions.reduce((count, record) => 
    count + record.suggested_updates.suggestions.filter(s => s.confidence >= 0.9).length, 0
  );

  return {
    suggestions,
    isLoading,
    fetchError: error,
    pendingCount,
    highConfidenceCount,
    applySuggestion: applyMutation.mutateAsync,
    isApplyingSuggestion: applyMutation.isPending,
    rejectSuggestion: rejectMutation.mutateAsync,
    isRejectingSuggestion: rejectMutation.isPending,
    markAsViewed: markViewedMutation.mutateAsync,
    bulkApply: bulkApplyMutation.mutateAsync,
    bulkReject: bulkRejectMutation.mutateAsync,
    isBulkProcessing: bulkApplyMutation.isPending || bulkRejectMutation.isPending,
  };
}; 