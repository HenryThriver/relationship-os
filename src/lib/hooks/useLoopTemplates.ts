import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopTemplate, LoopTemplateAction, LoopType, LoopStatus } from '@/types/artifact';
import { Database } from '@/lib/supabase/types_db';
import { useToast } from '@/lib/contexts/ToastContext';

// Type the Supabase client with our Database schema
const supabaseTyped = supabase as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;

// Use the correct Row type from the generated types
type LoopTemplateDBRow = Database['public']['Tables']['loop_templates']['Row'];
type LoopTemplateInsert = Database['public']['Tables']['loop_templates']['Insert'];
type LoopTemplateUpdate = Database['public']['Tables']['loop_templates']['Update'];

const mapRowToLoopTemplate = (row: LoopTemplateDBRow): LoopTemplate => ({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  loop_type: row.loop_type as LoopType,
  description: row.description,
  default_title_template: row.default_title_template,
  default_status: row.default_status as LoopStatus,
  reciprocity_direction: row.reciprocity_direction as 'giving' | 'receiving',
  default_actions: row.default_actions as LoopTemplateAction[] | null,
  typical_duration: row.typical_duration, // Match DB column name
  follow_up_schedule: row.follow_up_schedule as number[] | null, // Match DB column name
  completion_criteria: row.completion_criteria as string[] | null,
  created_at: row.created_at || '',
  updated_at: row.updated_at || '',
});

export const useLoopTemplates = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = ['loopTemplates'];

  const { data: loopTemplates = [], isLoading, error } = useQuery<LoopTemplate[], Error>({
    queryKey,
    queryFn: async () => {
      const { data: userResponse, error: userError } = await supabaseTyped.auth.getUser();
      if (userError || !userResponse.user) throw userError || new Error('User not authenticated.');

      const { data, error: fetchError } = await supabaseTyped
        .from('loop_templates')
        .select('*')
        .eq('user_id', userResponse.user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      return data ? data.map(mapRowToLoopTemplate) : [];
    },
  });

  type CreateLoopTemplateArgs = Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

  const createLoopTemplateMutation = useMutation<LoopTemplate, Error, CreateLoopTemplateArgs>({
    mutationFn: async (newTemplateData: CreateLoopTemplateArgs) => {
      const { data: userResponse, error: userError } = await supabaseTyped.auth.getUser();
      if (userError || !userResponse.user) throw userError || new Error('User not authenticated.');

      const templateToInsert: LoopTemplateInsert = {
        user_id: userResponse.user.id,
        name: newTemplateData.name,
        loop_type: newTemplateData.loop_type,
        description: newTemplateData.description,
        default_title_template: newTemplateData.default_title_template,
        default_status: newTemplateData.default_status,
        reciprocity_direction: newTemplateData.reciprocity_direction,
        default_actions: newTemplateData.default_actions as any, // JSONB handling
        typical_duration: newTemplateData.typical_duration, // Match DB column
        follow_up_schedule: newTemplateData.follow_up_schedule, // Match DB column
        completion_criteria: newTemplateData.completion_criteria,
      };

      const { data, error: insertError } = await supabaseTyped
        .from('loop_templates')
        .insert(templateToInsert)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Failed to create loop template, no data returned.');
      return mapRowToLoopTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast('Loop template created successfully!', 'success');
    },
    onError: (err: Error) => {
      showToast(`Failed to create loop template: ${err.message}`, 'error');
    },
  });

  type UpdateLoopTemplateArgs = Partial<Omit<LoopTemplate, 'user_id' | 'created_at'>> & { id: string };

  const updateLoopTemplateMutation = useMutation<LoopTemplate, Error, UpdateLoopTemplateArgs>({
    mutationFn: async (updateData: UpdateLoopTemplateArgs) => {
      const { id, ...templateUpdate } = updateData;

      const updatePayload: LoopTemplateUpdate = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are being updated
      if (templateUpdate.name !== undefined) updatePayload.name = templateUpdate.name;
      if (templateUpdate.loop_type !== undefined) updatePayload.loop_type = templateUpdate.loop_type;
      if (templateUpdate.description !== undefined) updatePayload.description = templateUpdate.description;
      if (templateUpdate.default_title_template !== undefined) updatePayload.default_title_template = templateUpdate.default_title_template;
      if (templateUpdate.default_status !== undefined) updatePayload.default_status = templateUpdate.default_status;
      if (templateUpdate.reciprocity_direction !== undefined) updatePayload.reciprocity_direction = templateUpdate.reciprocity_direction;
      if (templateUpdate.default_actions !== undefined) updatePayload.default_actions = templateUpdate.default_actions as any;
      if (templateUpdate.typical_duration !== undefined) updatePayload.typical_duration = templateUpdate.typical_duration;
      if (templateUpdate.follow_up_schedule !== undefined) updatePayload.follow_up_schedule = templateUpdate.follow_up_schedule;
      if (templateUpdate.completion_criteria !== undefined) updatePayload.completion_criteria = templateUpdate.completion_criteria;
      
      const { data, error: updateError } = await supabaseTyped
        .from('loop_templates')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error('Failed to update loop template, no data returned.');
      return mapRowToLoopTemplate(data);
    },
    onSuccess: (updatedTemplate: LoopTemplate) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.setQueryData([...queryKey, updatedTemplate.id], updatedTemplate);
      showToast('Loop template updated successfully!', 'success');
    },
    onError: (err: Error) => {
      showToast(`Failed to update loop template: ${err.message}`, 'error');
    },
  });

  const deleteLoopTemplateMutation = useMutation<void, Error, string>({
    mutationFn: async (templateId: string) => {
      const { error: deleteError } = await supabaseTyped
        .from('loop_templates')
        .delete()
        .eq('id', templateId);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_data: void, templateId: string) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.removeQueries({ queryKey: [...queryKey, templateId] });
      showToast('Loop template deleted successfully!', 'success');
    },
    onError: (err: Error) => {
      showToast(`Failed to delete loop template: ${err.message}`, 'error');
    },
  });

  return {
    loopTemplates,
    isLoading,
    error,
    createLoopTemplate: createLoopTemplateMutation.mutateAsync,
    updateLoopTemplate: updateLoopTemplateMutation.mutateAsync,
    deleteLoopTemplate: deleteLoopTemplateMutation.mutateAsync,
    isCreating: createLoopTemplateMutation.isPending, // Use isPending instead of isLoading
    isUpdating: updateLoopTemplateMutation.isPending,
    isDeleting: deleteLoopTemplateMutation.isPending,
  };
}; 