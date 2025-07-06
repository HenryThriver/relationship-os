'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopAnalytic, LoopStatusTransition } from '@/types/artifact';
import { Database } from '@/lib/supabase/types_db';
import { useToast } from '@/lib/contexts/ToastContext';

type LoopAnalyticRow = Database['public']['Tables']['loop_analytics']['Row'];
type LoopAnalyticInsert = Database['public']['Tables']['loop_analytics']['Insert'];
type LoopAnalyticUpdate = Database['public']['Tables']['loop_analytics']['Update'];

// Helper to map database row to LoopAnalytic type
const mapRowToLoopAnalytic = (row: LoopAnalyticRow): LoopAnalytic => {
  let statusTransitions: LoopStatusTransition[] = [];
  if (row.status_transitions) {
    try {
      // Ensure status_transitions is parsed correctly, whether it's a string or already an object
      statusTransitions = typeof row.status_transitions === 'string'
        ? JSON.parse(row.status_transitions)
        : row.status_transitions as unknown as LoopStatusTransition[]; // TODO: Add runtime validation for each transition object
      if (!Array.isArray(statusTransitions)) {
        console.warn('Parsed status_transitions is not an array, defaulting to empty.', statusTransitions);
        statusTransitions = [];
      }
    } catch (e) {
      console.error('Failed to parse status_transitions for loop analytic:', row.id, e);
      statusTransitions = [];
    }
  }

  return {
    ...row,
    status_transitions: statusTransitions,
    // Ensure other JSONB or specific type fields are handled if necessary in the future
  } as LoopAnalytic; // Cast as LoopAnalytic, but ensure all fields match
};


export const useLoopAnalytics = (loopArtifactId?: string, contactId?: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const analyticsQueryKey = ['loopAnalytics', loopArtifactId, contactId].filter(Boolean);

  // Fetch loop analytics
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
    refetch: refetchAnalytics,
  } = useQuery<LoopAnalytic[], Error>({
    queryKey: analyticsQueryKey,
    queryFn: async () => {
      let query = supabase.from('loop_analytics').select('*');
      if (loopArtifactId) {
        query = query.eq('loop_artifact_id', loopArtifactId);
      }
      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRowToLoopAnalytic);
    },
    enabled: !!(loopArtifactId || contactId), // Only run if one of the IDs is provided
  });

  // Create loop analytic
  const createAnalyticMutation = useMutation<LoopAnalytic, Error, LoopAnalyticInsert>(
    {
      mutationFn: async (analyticData) => {
        const { data, error } = await supabase
          .from('loop_analytics')
          .insert(analyticData)
          .select()
          .single();
        if (error) throw error;
        return mapRowToLoopAnalytic(data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
        // Potentially invalidate other related queries
        showToast('Loop analytic record created!', 'success');
      },
      onError: (error) => {
        showToast(`Error creating loop analytic: ${error.message}`, 'error');
        console.error('Create loop analytic error:', error);
      },
    }
  );

  // Update loop analytic
  const updateAnalyticMutation = useMutation<
    LoopAnalytic,
    Error,
    Partial<LoopAnalyticUpdate> & { id: string } // Require ID for updates
  >({
    mutationFn: async (analyticData) => {
      const { id, ...updateData } = analyticData;
      const { data, error } = await supabase
        .from('loop_analytics')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapRowToLoopAnalytic(data);
    },
    onSuccess: (updatedAnalytic) => {
      queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
      // Also invalidate specific analytic entry if we cache by ID elsewhere
      queryClient.invalidateQueries({ queryKey: ['loopAnalytics', updatedAnalytic.id] });
      showToast('Loop analytic updated!', 'success');
    },
    onError: (error) => {
      showToast(`Error updating loop analytic: ${error.message}`, 'error');
      console.error('Update loop analytic error:', error);
    },
  });
  
  // Function to add a status transition to an existing analytic record
  const addStatusTransitionMutation = useMutation<
    LoopAnalytic,
    Error,
    { analyticId: string; transition: LoopStatusTransition }
  >({
    mutationFn: async ({ analyticId, transition }) => {
      // 1. Fetch current analytic record
      const { data: currentAnalytic, error: fetchError } = await supabase
        .from('loop_analytics')
        .select('status_transitions')
        .eq('id', analyticId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentAnalytic) throw new Error('Loop analytic record not found.');

      let currentTransitions: LoopStatusTransition[] = [];
      // currentAnalytic should now be correctly typed if TS server picked up changes
      const rowData = currentAnalytic as LoopAnalyticRow; // Still might need a base cast to LoopAnalyticRow if 'select' is too generic

      if (rowData.status_transitions) {
          try {
            currentTransitions = typeof rowData.status_transitions === 'string'
              ? JSON.parse(rowData.status_transitions)
              : rowData.status_transitions as unknown as LoopStatusTransition[]; // This cast might still be needed for Json to structured type
            if (!Array.isArray(currentTransitions)) {
                currentTransitions = [];
            }
          } catch (e) {
              console.error('Failed to parse existing status_transitions:', e);
              currentTransitions = []; // Default to empty if parsing fails
          }
      }
      
      const updatedTransitions = [...currentTransitions, transition];

      // 2. Update the record
      const { data, error } = await supabase
        .from('loop_analytics')
        .update({ status_transitions: updatedTransitions as unknown as Database["public"]["Tables"]["loop_analytics"]["Row"]["status_transitions"] })
        .eq('id', analyticId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToLoopAnalytic(data);
    },
    onSuccess: (updatedAnalytic) => {
      queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['loopAnalytics', updatedAnalytic.id] });
      showToast('Loop status transition recorded!', 'success');
    },
    onError: (error) => {
      showToast(`Error adding status transition: ${error.message}`, 'error');
      console.error('Add status transition error:', error);
    },
  });


  return {
    analytics,
    isLoadingAnalytics,
    isErrorAnalytics,
    refetchAnalytics,
    createAnalytic: createAnalyticMutation.mutate,
    updateAnalytic: updateAnalyticMutation.mutate,
    addStatusTransition: addStatusTransitionMutation.mutate,
    isCreatingAnalytic: createAnalyticMutation.isPending,
    isUpdatingAnalytic: updateAnalyticMutation.isPending,
    isAddingTransition: addStatusTransitionMutation.isPending,
  };
}; 