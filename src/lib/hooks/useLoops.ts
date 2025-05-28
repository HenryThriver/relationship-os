import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopArtifact, LoopStatus, LoopType, LoopArtifactContent, LoopAction, ArtifactTypeEnum, LoopTemplate, LoopTemplateAction } from '@/types/artifact';
import { useToast } from '@/lib/contexts/ToastContext';
import { DatabaseArtifactRow, DatabaseArtifactInsert } from '@/types/artifact'; // Import base types
import { Json, type Database } from '../supabase/types_db'; // Testing relative path

// Helper to parse LoopTemplate default_actions (similar to useLoopTemplates)
// This is a simplified version for use here. A shared utility might be better.
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
        .select('*')
        .eq('contact_id', contactId)
        .eq('type', 'loop' as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(d => {
        const row = d as DatabaseArtifactRow;
        let parsedContent: LoopArtifactContent;
        try {
          // Assuming row.content is a JSON string
          parsedContent = JSON.parse(row.content) as LoopArtifactContent;
        } catch (e) {
          console.error('Failed to parse loop content:', e, row.content);
          // Provide a default or fallback content structure
          // This is a critical error, ideally, content should always be parsable
          // Or the LoopArtifactContent type should allow for a partial/error state
          parsedContent = { 
            type: LoopType.INTRODUCTION, // Default type
            status: LoopStatus.ABANDONED, // Default status indicating an issue
            title: 'Error: Invalid Content',
            description: 'Loop content was not parsable.',
            initiator: 'user',
            actions: [],
            reciprocity_direction: 'giving',
          } as LoopArtifactContent;
        }
        return {
          ...row,
          type: 'loop', // Assert type on our end
          content: parsedContent,
        } as LoopArtifact;
      });
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
      templateId?: string; // Added templateId
    }
  >({
    mutationFn: async (loopData) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      let initialActions: LoopAction[] = [];

      if (loopData.templateId) {
        const { data: templateRow, error: templateError } = await supabase
          .from('loop_templates') // This will cause a linter error if types_db.ts is not fixed
          .select('default_actions')
          .eq('id', loopData.templateId)
          .eq('user_id', user.id) // Ensure user owns the template
          .single();
        
        if (templateError) {
          console.warn(`Failed to fetch template ${loopData.templateId}:`, templateError.message);
          // Proceed without template actions if fetch fails
        } else if (templateRow && templateRow.default_actions) {
          const templateActions = parseTemplateDefaultActions(templateRow.default_actions as Json | null);
          if (templateActions) {
            initialActions = templateActions.map((ta: LoopTemplateAction): LoopAction => ({
              id: crypto.randomUUID(),
              status: LoopStatus.IDEA, // Or derive from template action if needed
              action_type: ta.action_type,
              notes: ta.description_template || '',
              // due_date could be calculated based on ta.default_offset_days
              created_at: new Date().toISOString(),
            }));
          }
        }
      }

      // If no template actions, add a default initial action
      if (initialActions.length === 0) {
        initialActions.push({
          id: crypto.randomUUID(),
          status: LoopStatus.IDEA,
          action_type: 'offer', // Or a more generic 'initial_setup' type
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

      const artifactToInsertExplicit: Database['public']['Tables']['artifacts']['Insert'] = {
        contact_id: contactId,
        user_id: user.id,
        type: 'loop' as ArtifactTypeEnum, 
        content: JSON.stringify(newLoopContent), 
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('artifacts')
        .insert(artifactToInsertExplicit as any)
        .select()
        .single();

      if (error) throw error;
      const row = data as DatabaseArtifactRow;
      // Assuming row.content is a JSON string from the DB response after insert
      let parsedContent: LoopArtifactContent;
      try {
        parsedContent = JSON.parse(row.content) as LoopArtifactContent;
      } catch (e) {
        // This should ideally not happen if we just stringified it
        console.error('Failed to parse loop content immediately after insert:', e, row.content);
        parsedContent = newLoopContent; // Fallback to the data we tried to insert
      }
      return {
         ...row,
         type: 'loop',
         content: parsedContent,
      } as LoopArtifact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      showToast('Loop created successfully!', 'success');
    },
    onError: (error) => {
      showToast('Failed to create loop', 'error');
      console.error('Create loop error:', error);
    }
  });

  // Update loop status
  const updateStatusMutation = useMutation<
    LoopArtifact,
    Error,
    { loopId: string; newStatus: LoopStatus }
  >({
    mutationFn: async ({ loopId, newStatus }) => {
      const { data: currentLoopResult, error: fetchError } = await supabase
        .from('artifacts')
        .select('id, content')
        .eq('id', loopId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentLoopResult) throw new Error('Loop not found');

      let currentContent: LoopArtifactContent;
      try {
        // Assuming currentLoopResult.content is a JSON string
        currentContent = JSON.parse(currentLoopResult.content as string) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse current loop content for update:', e, currentLoopResult.content);
        // Fallback or error handling needed
        throw new Error('Failed to parse existing loop content.');
      }
      
      const newStatusAction: LoopAction = {
        id: crypto.randomUUID(),
        status: newStatus,
        action_type: getActionTypeForStatus(newStatus),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const updatedContent: LoopArtifactContent = {
        ...currentContent,
        status: newStatus,
        actions: [
          ...(currentContent.actions || []),
          newStatusAction
        ]
      };
      
      switch (newStatus) {
        case LoopStatus.OFFERED: updatedContent.offered_at = new Date().toISOString(); break;
        case LoopStatus.ACCEPTED: updatedContent.accepted_at = new Date().toISOString(); break;
        case LoopStatus.DELIVERED: updatedContent.delivered_at = new Date().toISOString(); break;
        case LoopStatus.COMPLETED: updatedContent.completed_at = new Date().toISOString(); break;
      }

      const { data, error } = await supabase
        .from('artifacts')
        .update({
          content: JSON.stringify(updatedContent), // Stringify content for update
          updated_at: new Date().toISOString()
        })
        .eq('id', loopId)
        .select()
        .single();

      if (error) throw error;
      const row = data as DatabaseArtifactRow;
      // Assuming row.content is a JSON string from the DB response after update
      let parsedContent: LoopArtifactContent;
      try {
        parsedContent = JSON.parse(row.content) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse loop content immediately after update:', e, row.content);
        // Fallback or error handling, potentially use updatedContent if parsing fails
        parsedContent = updatedContent; 
      }
      return {
        ...row,
        type: 'loop',
        content: parsedContent,
      } as LoopArtifact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      showToast('Loop status updated!', 'success');
    },
    onError: (error) => {
      showToast('Failed to update loop status', 'error');
      console.error('Update loop status error:', error);
    }
  });

  // Add new action to a loop
  const addActionMutation = useMutation<
    LoopArtifact, // Return type
    Error,        // Error type
    {             // Variables type
      loopId: string;
      actionData: Omit<LoopAction, 'id' | 'created_at'>; // User provides type, notes, due_date etc.
    }
  >({
    mutationFn: async ({ loopId, actionData }) => {
      // 1. Fetch the current loop
      const { data: currentLoopResult, error: fetchError } = await supabase
        .from('artifacts')
        .select('content') // Only need content
        .eq('id', loopId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentLoopResult) throw new Error('Loop not found to add action.');

      let currentContent: LoopArtifactContent;
      try {
        currentContent = JSON.parse(currentLoopResult.content as string) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse current loop content for adding action:', e, currentLoopResult.content);
        throw new Error('Failed to parse existing loop content for adding action.');
      }

      // 2. Create the new action
      const newAction: LoopAction = {
        ...actionData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      // 3. Append to actions array
      const updatedContent: LoopArtifactContent = {
        ...currentContent,
        actions: [...(currentContent.actions || []), newAction],
        // Optionally update loop's overall next_action_due or status based on this new action
        // For example, if this new action has a due_date, it might become the loop's next_action_due
        // updatedContent.next_action_due = newAction.due_date || currentContent.next_action_due;
      };

      // 4. Update the artifact in Supabase
      const { data, error } = await supabase
        .from('artifacts')
        .update({
          content: JSON.stringify(updatedContent), // Stringify content for update
          updated_at: new Date().toISOString(),
        })
        .eq('id', loopId)
        .select()
        .single();

      if (error) throw error;
      
      // 5. Return the updated loop artifact (parsed)
      const row = data as DatabaseArtifactRow;
      let parsedContent: LoopArtifactContent;
      try {
        parsedContent = JSON.parse(row.content as string) as LoopArtifactContent;
      } catch (e) {
        console.error('Failed to parse loop content after adding action:', e, row.content);
        parsedContent = updatedContent; // Fallback to the data we tried to update with
      }
      return {
        ...(row as Omit<DatabaseArtifactRow, 'content' | 'type'>), // Avoid conflicts with parsed content
        id: row.id, // ensure id is present
        contact_id: contactId, // ensure contact_id is present from the hook scope if not on row
        user_id: row.user_id, // ensure user_id is present
        created_at: row.created_at, // ensure created_at is present
        updated_at: row.updated_at, // ensure updated_at is present
        timestamp: row.timestamp, // ensure timestamp is present
        type: 'loop',
        content: parsedContent,
      } as LoopArtifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      // Potentially invalidate queries for the specific loop details if those exist
      // queryClient.invalidateQueries({ queryKey: ['loop', data.id] }); 
      showToast('Action added to loop successfully!', 'success');
    },
    onError: (error) => {
      showToast('Failed to add action to loop', 'error');
      console.error('Add action to loop error:', error);
    },
  });

  return {
    loops,
    isLoading,
    isError,
    refetch,
    createLoop: createLoopMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    addAction: addActionMutation.mutate, // Expose the new mutation
    isCreating: createLoopMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isAddingAction: addActionMutation.isPending, // Expose loading state for adding action
  };
};

// Helper function to determine action type based on status
function getActionTypeForStatus(status: LoopStatus): LoopAction['action_type'] { // More specific return type
  const actionMap: Partial<Record<LoopStatus, LoopAction['action_type']>> = { // Use Partial for safety
    [LoopStatus.IDEA]: 'offer', // Or a new 'ideation' action_type if it exists
    [LoopStatus.QUEUED]: 'offer', // Or 'queue'
    [LoopStatus.OFFERED]: 'offer',
    [LoopStatus.RECEIVED]: 'delivery', // Or 'receive' if that type exists
    [LoopStatus.ACCEPTED]: 'delivery', // Or 'accept'
    [LoopStatus.DECLINED]: 'completion', // Or 'decline'
    [LoopStatus.IN_PROGRESS]: 'delivery', // Or 'progress'
    [LoopStatus.PENDING_APPROVAL]: 'approval_request',
    [LoopStatus.DELIVERED]: 'delivery',
    [LoopStatus.FOLLOWING_UP]: 'follow_up',
    [LoopStatus.COMPLETED]: 'completion',
    [LoopStatus.ABANDONED]: 'completion' // Or 'abandonment'
  };
  return actionMap[status] || 'check_in'; // Default to 'check_in' or a generic 'update'
} 