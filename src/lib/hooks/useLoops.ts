import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopArtifact, LoopStatus, LoopType, LoopArtifactContent, LoopAction, ArtifactTypeEnum, LoopTemplate, LoopTemplateAction } from '@/types/artifact';
import { useToast } from '@/lib/contexts/ToastContext';
import { Json, type Database, type Tables, type TablesInsert, type TablesUpdate } from '../supabase/types_db';

// Helper to parse LoopTemplate default_actions
const parseTemplateDefaultActions = (jsonInput: Json | null): LoopTemplateAction[] | null => {
  if (jsonInput === null || jsonInput === undefined) return null;
  let actionsArray: any;
  if (typeof jsonInput === 'string') {
    try { actionsArray = JSON.parse(jsonInput); } catch (e) { return null; }
  } else {
    actionsArray = jsonInput;
  }
  return Array.isArray(actionsArray) ? actionsArray as LoopTemplateAction[] : null;
};

export const useLoops = (contactId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch loops for contact
  const {
    data: loops,
    isLoading,
    isError,
    refetch
  } = useQuery<LoopArtifact[], Error>({
    queryKey: ['loops', contactId],
    queryFn: async (): Promise<LoopArtifact[]> => {
      const { data, error } = await supabase
        .from('artifacts')
        .select<'*', Tables<'artifacts'>>('*')
        .eq('contact_id', contactId)
        .eq('type', 'loop' as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data
        .map((row: Tables<'artifacts'>): LoopArtifact | null => {
          if (row.type !== 'loop') {
            console.warn(`Fetched non-loop artifact in useLoops: ${row.id}, type: ${row.type}`);
            return null;
          }
          let parsedContent: LoopArtifactContent;
          try {
            parsedContent = JSON.parse(row.content) as LoopArtifactContent;
          } catch (e) {
            console.error('Failed to parse loop content:', e, row.content);
            parsedContent = { 
              type: LoopType.INTRODUCTION,
              status: LoopStatus.ABANDONED,
              title: 'Error: Invalid Content',
              description: 'Loop content was not parsable.',
              initiator: 'user',
              actions: [],
              reciprocity_direction: 'giving',
            } as LoopArtifactContent;
          }
          return {
            ...row,
            type: 'loop',
            content: parsedContent,
            metadata: row.metadata, // Ensure metadata is passed if LoopArtifact expects it
          } as LoopArtifact; 
        })
        .filter((loop): loop is LoopArtifact => loop !== null);
    }
  });

  // Create new loop
  const createLoopMutation = useMutation<
    LoopArtifact,
    Error,
    {
      title: string;
      description: string;
      type: LoopType;
      reciprocity_direction: 'giving' | 'receiving';
      templateId?: string;
    }
  >({
    mutationFn: async (loopData) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      let initialActions: LoopAction[] = [];
      if (loopData.templateId) {
        const { data: templateRow, error: templateError } = await supabase
          .from('loop_templates' as any)
          .select<'default_actions', { default_actions: Json | null }>('default_actions')
          .eq('id', loopData.templateId)
          .eq('user_id', user.id)
          .single();
        
        if (templateError) {
          console.warn(`Failed to fetch template ${loopData.templateId}:`, templateError.message);
        } else if (templateRow && templateRow.default_actions) {
          const templateActions = parseTemplateDefaultActions(templateRow.default_actions);
          if (templateActions) {
            initialActions = templateActions.map((ta: LoopTemplateAction): LoopAction => ({
              id: crypto.randomUUID(),
              status: LoopStatus.IDEA, 
              action_type: ta.action_type,
              notes: ta.description_template || '',
              created_at: new Date().toISOString(),
            }));
          }
        }
      }

      if (initialActions.length === 0) {
        initialActions.push({
          id: crypto.randomUUID(),
          status: LoopStatus.IDEA,
          action_type: 'offer',
          created_at: new Date().toISOString(),
          notes: 'Loop initiated'
        });
      }
      
      const newLoopContent: LoopArtifactContent = {
        title: loopData.title,
        description: loopData.description,
        type: loopData.type,
        reciprocity_direction: loopData.reciprocity_direction,
        status: LoopStatus.IDEA,
        initiator: 'user',
        actions: initialActions,
      };

      const artifactToInsert: TablesInsert<'artifacts'> = {
        contact_id: contactId,
        user_id: user.id,
        type: 'loop' as any,
        content: JSON.stringify(newLoopContent), 
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('artifacts')
        .insert(artifactToInsert as any)
        .select<'*', Tables<'artifacts'>>('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create loop, no data returned.');
      
      const row = data; 
      let parsedContent: LoopArtifactContent;
      try {
        parsedContent = JSON.parse(row.content) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse loop content immediately after insert:', e, row.content);
        parsedContent = newLoopContent;
      }
      return {
         ...row,
         type: 'loop',
         content: parsedContent,
         metadata: row.metadata,
      } as LoopArtifact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      showToast('Loop created successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to create loop: ${error.message}`, 'error');
      console.error('Create loop error:', error);
    }
  });

  // Define a type for the selected fields from artifact row for mutations
  type SelectedArtifactFieldsForMutation = Pick<Tables<'artifacts'>, 'id' | 'content' | 'type' | 'user_id' | 'contact_id' | 'timestamp' | 'created_at' | 'updated_at' | 'metadata'>;

  // Update loop status
  const updateStatusMutation = useMutation<
    LoopArtifact,
    Error,
    { loopId: string; newStatus: LoopStatus }
  >({
    mutationFn: async ({ loopId, newStatus }) => {
      const { data: currentLoopResult, error: fetchError } = await supabase
        .from('artifacts')
        .select<'id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata', SelectedArtifactFieldsForMutation>('id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata')
        .eq('id', loopId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentLoopResult) throw new Error('Loop not found for status update');
      if (currentLoopResult.type !== 'loop') throw new Error('Cannot update status of a non-loop artifact.');

      let currentContent: LoopArtifactContent;
      try {
        currentContent = JSON.parse(currentLoopResult.content) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse current loop content for update:', e, currentLoopResult.content);
        throw new Error('Failed to parse current loop content');
      }

      const updatedContent: LoopArtifactContent = {
        ...currentContent,
        status: newStatus,
      };
      
      const updatePayload = { content: JSON.stringify(updatedContent) };

      const { data: updatedLoop, error: updateError } = await supabase
        .from('artifacts')
        .update(updatePayload as any)
        .eq('id', loopId)
        .select<'*', Tables<'artifacts'>>('*')
        .single();

      if (updateError) throw updateError;
      if (!updatedLoop) throw new Error('Failed to update loop, no data returned.');

      return {
        ...updatedLoop,
        type: 'loop',
        content: updatedContent,
        metadata: updatedLoop.metadata,
      } as LoopArtifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      queryClient.invalidateQueries({ queryKey: ['loop', data.id] });
      showToast('Loop status updated!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to update loop status: ${error.message}`, 'error');
      console.error('Update loop status error:', error);
    }
  });

  // Add action to loop
  const addActionMutation = useMutation<
    LoopArtifact, 
    Error, 
    { loopId: string; action: LoopAction }
  >({
    mutationFn: async ({ loopId, action }) => {
      const { data: currentLoopResult, error: fetchError } = await supabase
        .from('artifacts')
        .select<'id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata', SelectedArtifactFieldsForMutation>('id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata')
        .eq('id', loopId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentLoopResult) throw new Error('Loop not found for adding action');
      if (currentLoopResult.type !== 'loop') throw new Error('Cannot add action to a non-loop artifact.');

      let currentContent: LoopArtifactContent;
      try {
        currentContent = JSON.parse(currentLoopResult.content) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse current loop content for adding action:', e, currentLoopResult.content);
        throw new Error('Failed to parse current loop content');
      }

      const updatedContent: LoopArtifactContent = {
        ...currentContent,
        actions: [...(currentContent.actions || []), action],
      };
      
      const updatePayload = { content: JSON.stringify(updatedContent) };

      const { data: updatedLoop, error: updateError } = await supabase
        .from('artifacts')
        .update(updatePayload as any)
        .eq('id', loopId)
        .select<'*', Tables<'artifacts'>>('*')
        .single();

      if (updateError) throw updateError;
      if (!updatedLoop) throw new Error('Failed to update loop with new action, no data returned.');

      return {
        ...updatedLoop,
        type: 'loop',
        content: updatedContent,
        metadata: updatedLoop.metadata,
      } as LoopArtifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      queryClient.invalidateQueries({ queryKey: ['loop', data.id] });
      showToast('Action added to loop!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to add action: ${error.message}`, 'error');
      console.error('Add action error:', error);
    }
  });

  // Update action within a loop
  const updateActionMutation = useMutation<
    LoopArtifact, 
    Error, 
    { loopId: string; actionId: string; updates: Partial<LoopAction> }
  >({
    mutationFn: async ({ loopId, actionId, updates }) => {
      const { data: currentLoopResult, error: fetchError } = await supabase
        .from('artifacts')
        .select<'id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata', SelectedArtifactFieldsForMutation>('id, content, type, user_id, contact_id, timestamp, created_at, updated_at, metadata')
        .eq('id', loopId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentLoopResult) throw new Error('Loop not found for updating action');
      if (currentLoopResult.type !== 'loop') throw new Error('Cannot update action in a non-loop artifact.');

      let currentContent: LoopArtifactContent;
      try {
        currentContent = JSON.parse(currentLoopResult.content) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse current loop content for updating action:', e, currentLoopResult.content);
        throw new Error('Failed to parse current loop content');
      }

      const actionIndex = currentContent.actions.findIndex(a => a.id === actionId);
      if (actionIndex === -1) throw new Error('Action not found in loop');

      const updatedActions = [...currentContent.actions];
      updatedActions[actionIndex] = { ...updatedActions[actionIndex], ...updates };

      const updatedContent: LoopArtifactContent = {
        ...currentContent,
        actions: updatedActions,
      };
      
      const updatePayload = { content: JSON.stringify(updatedContent) };

      const { data: updatedLoop, error: updateError } = await supabase
        .from('artifacts')
        .update(updatePayload as any)
        .eq('id', loopId)
        .select<'*', Tables<'artifacts'>>('*')
        .single();

      if (updateError) throw updateError;
      if (!updatedLoop) throw new Error('Failed to update loop action, no data returned.');

      return {
        ...updatedLoop,
        type: 'loop',
        content: updatedContent,
        metadata: updatedLoop.metadata,
      } as LoopArtifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      queryClient.invalidateQueries({ queryKey: ['loop', data.id] });
      showToast('Loop action updated!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to update loop action: ${error.message}`, 'error');
      console.error('Update loop action error:', error);
    }
  });
  
  function getActionTypeForStatus(status: LoopStatus): LoopAction['action_type'] { 
    switch (status) {
      case LoopStatus.OFFERED:
      case LoopStatus.ACCEPTED:
        return 'follow_up';
      case LoopStatus.IN_PROGRESS:
        return 'check_in';
      case LoopStatus.PENDING_APPROVAL:
        return 'approval_request';
      case LoopStatus.DELIVERED:
        return 'delivery'; 
      case LoopStatus.FOLLOWING_UP:
          return 'follow_up';
      case LoopStatus.COMPLETED:
        return 'completion'; 
      default:
        return 'check_in'; 
    }
  }

  const addDefaultNextActionMutation = useMutation<
    LoopArtifact, 
    Error, 
    { loopId: string; currentStatus: LoopStatus }
  >({
    mutationFn: async ({ loopId, currentStatus }) => {
      const actionType = getActionTypeForStatus(currentStatus);
      const newAction: LoopAction = {
        id: crypto.randomUUID(),
        status: currentStatus, 
        action_type: actionType,
        created_at: new Date().toISOString(),
        notes: `Default action for ${currentStatus} status.`
      };
      return addActionMutation.mutateAsync({ loopId, action: newAction });
    },
    onSuccess: () => {
      showToast('Default next action added to loop!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to add default next action: ${error.message}`, 'error');
      console.error('Add default next action error:', error);
    }
  });

  return {
    loops: loops || [],
    isLoading,
    isError,
    refetchLoops: refetch,
    createLoop: createLoopMutation.mutateAsync,
    isCreatingLoop: createLoopMutation.isPending,
    updateLoopStatus: updateStatusMutation.mutateAsync,
    isUpdatingLoopStatus: updateStatusMutation.isPending,
    addLoopAction: addActionMutation.mutateAsync,
    isAddingLoopAction: addActionMutation.isPending,
    updateLoopAction: updateActionMutation.mutateAsync,
    isUpdatingLoopAction: updateActionMutation.isPending,
    addDefaultNextAction: addDefaultNextActionMutation.mutateAsync,
    isAddingDefaultNextAction: addDefaultNextActionMutation.isPending,
  };
}; 