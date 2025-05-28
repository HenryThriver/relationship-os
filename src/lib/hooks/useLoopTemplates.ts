import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopTemplate, LoopType, LoopTemplateAction } from '@/types/artifact';
import { Database, Json } from '../supabase/types_db';
import { useToast } from '@/lib/contexts/ToastContext';

// Define the shape of data coming from/going to the 'loop_templates' table
// This can be more specific if we want to map DB column names to different interface keys
type LoopTemplateRow = Database['public']['Tables']['loop_templates']['Row'];
type LoopTemplateInsert = Database['public']['Tables']['loop_templates']['Insert'];
type LoopTemplateUpdate = Database['public']['Tables']['loop_templates']['Update'];

// Helper to safely parse default_actions from Json | null
const parseDefaultActions = (jsonInput: Json | null): LoopTemplateAction[] | null => {
  if (jsonInput === null || jsonInput === undefined) return null;

  let actionsArray: any;
  if (typeof jsonInput === 'string') {
    try {
      actionsArray = JSON.parse(jsonInput);
    } catch (e) {
      console.error('Failed to parse default_actions JSON string:', e, jsonInput);
      return null; // Or return empty array / throw error
    }
  } else {
    actionsArray = jsonInput; // Assumes it's already in array/object form if not a string
  }

  if (Array.isArray(actionsArray)) {
    // Perform a runtime check or a more careful mapping if needed for production robustness
    // For now, we'll cast, assuming the structure matches LoopTemplateAction[]
    return actionsArray as LoopTemplateAction[]; 
  }
  console.warn('default_actions was not an array after parsing/accessing:', actionsArray);
  return null; // Or empty array
};

const mapRowToLoopTemplate = (row: LoopTemplateRow): LoopTemplate => {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    loop_type: row.loop_type as unknown as LoopType, // Cast from string to enum
    description: row.description,
    default_actions: parseDefaultActions(row.default_actions),
    typical_duration_days: row.typical_duration,
    follow_up_schedule_days: row.follow_up_schedule as number[] | null, // Assuming DB returns number[] or null
    completion_criteria: row.completion_criteria as string[] | null, // Assuming DB returns string[] or null
    created_at: row.created_at || new Date().toISOString(), // Fallback if null from DB
    updated_at: row.updated_at || new Date().toISOString(), // Fallback if null from DB
  };
};

export const useLoopTemplates = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch all loop templates for the current user
  const { data: templates, isLoading, isError, refetch } = useQuery<
    LoopTemplate[],
    Error
  >({
    queryKey: ['loopTemplates'],
    queryFn: async () => {
      const { data: userSession } = await supabase.auth.getUser();
      if (!userSession?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('loop_templates')
        .select('*')
        .eq('user_id', userSession.user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      // If data is null (e.g. RLS prevents access), supabase client might return null instead of empty array
      return (data || []).map(mapRowToLoopTemplate);
    },
  });

  // Create new loop template
  const createTemplateMutation = useMutation<
    LoopTemplate,
    Error,
    Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >({
    mutationFn: async (templateData) => {
      const { data: userSession } = await supabase.auth.getUser();
      if (!userSession?.user) throw new Error('User not authenticated');

      const insertData: LoopTemplateInsert = {
        name: templateData.name,
        user_id: userSession.user.id,
        loop_type: templateData.loop_type as string, // DB expects string for enum
        description: templateData.description,
        default_actions: templateData.default_actions 
          ? JSON.stringify(templateData.default_actions) 
          : null,
        typical_duration: templateData.typical_duration_days,
        follow_up_schedule: templateData.follow_up_schedule_days,
        completion_criteria: templateData.completion_criteria,
        // created_at and updated_at have db defaults
      };

      const { data, error } = await supabase
        .from('loop_templates')
        .insert(insertData)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create template, no data returned.');
      return mapRowToLoopTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loopTemplates'] });
      showToast('Loop template created successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to create loop template: ${error.message}`, 'error');
    },
  });

  // Update existing loop template
  const updateTemplateMutation = useMutation<
    LoopTemplate,
    Error,
    Partial<Omit<LoopTemplate, 'user_id' | 'created_at'> & { id: string }>
  >({
    mutationFn: async (templateData) => {
      const { id, ...updateFields } = templateData;
      
      const updatePayload: Partial<LoopTemplateUpdate> = { // Use Partial for update payload
        name: updateFields.name,
        loop_type: updateFields.loop_type as string | undefined,
        description: updateFields.description,
        typical_duration: updateFields.typical_duration_days,
        follow_up_schedule: updateFields.follow_up_schedule_days,
        completion_criteria: updateFields.completion_criteria,
        updated_at: new Date().toISOString(),
      };

      if (updateFields.hasOwnProperty('default_actions')) {
        updatePayload.default_actions = updateFields.default_actions 
          ? JSON.stringify(updateFields.default_actions) 
          : null;
      }
      
      const { data, error } = await supabase
        .from('loop_templates')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update template, no data returned.');
      return mapRowToLoopTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loopTemplates'] });
      showToast('Loop template updated successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to update loop template: ${error.message}`, 'error');
    },
  });

  // Delete loop template
  const deleteTemplateMutation = useMutation<void, Error, string>({
    mutationFn: async (templateId) => {
      const { error } = await supabase
        .from('loop_templates')
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loopTemplates'] });
      showToast('Loop template deleted successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to delete loop template: ${error.message}`, 'error');
    },
  });

  return {
    templates,
    isLoading,
    isError,
    refetchTemplates: refetch,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    isCreatingTemplate: createTemplateMutation.isPending,
    isUpdatingTemplate: updateTemplateMutation.isPending,
    isDeletingTemplate: deleteTemplateMutation.isPending,
  };
}; 