import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types_db';

// Define the type for a new artifact based on your DB schema
// This should align with Tables<"artifacts">["Insert"] from types_db.ts
export type NewArtifact = Database['public']['Tables']['artifacts']['Insert'];
export type Artifact = Database['public']['Tables']['artifacts']['Row'];

const ARTIFACTS_TABLE = 'artifacts';

// Argument type for the delete mutation, including contact_id for optimistic updates
interface DeleteArtifactParams {
  id: string;
  contactId?: string | null; // Optional: contact_id for precise cache updates
}

export const useArtifacts = () => {
  const queryClient = useQueryClient();

  // Create a new artifact
  const createArtifactDB = async (newArtifact: NewArtifact): Promise<Artifact> => {
    // Ensure user_id is populated if not already. For RLS, it must match auth.uid()
    // This might be automatically handled if your RLS policies are set up correctly and user_id is part of NewArtifact type.
    // If user_id is not part of NewArtifact, you might need to fetch it here or ensure it's added before this call.
    
    const { data, error } = await supabase
      .from(ARTIFACTS_TABLE)
      .insert(newArtifact)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating artifact:', error);
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('Artifact creation failed, no data returned.');
    }
    return data;
  };

  const createArtifactMutation = useMutation<Artifact, Error, NewArtifact>({
    mutationFn: createArtifactDB,
    onSuccess: (newArtifactData) => {
      // Invalidate queries related to artifacts for a contact
      if (newArtifactData.contact_id) {
        queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE, { contact_id: newArtifactData.contact_id }] });
      }
      // Invalidate any general artifact lists if you have them
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE, 'list'] }); // Example general list key
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE]}); // Broader invalidation
    },
    onError: (error) => {
      console.error('Mutation error creating artifact:', error);
    }
  });

  // Delete an artifact
  const deleteArtifactDB = async (artifactId: string): Promise<void> => {
    const response = await fetch(`/api/artifacts/${artifactId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete artifact. Status: ${response.status}` }));
      // Include code from errorData if available, for specific handling like 409 ARTIFACT_IS_SOURCE
      const err = new Error(errorData.message || `Failed to delete artifact. Status: ${response.status}`);
      (err as any).code = errorData.code; // Attach the specific error code if present
      throw err;
    }
    // For 204 No Content, there is no body to parse
    if (response.status === 204) {
        return;
    }
    // Should not happen for a 204, but as a safeguard
    const data = await response.json(); 
    return data;
  };

  const deleteArtifactMutation = useMutation<
    void, 
    Error, 
    DeleteArtifactParams, 
    { previousArtifactsForContact?: Artifact[], contactId?: string | null }
  >({
    mutationFn: (params: DeleteArtifactParams) => deleteArtifactDB(params.id),
    onMutate: async ({ id: deletedArtifactId, contactId }) => {
      await queryClient.cancelQueries({ queryKey: [ARTIFACTS_TABLE, { contact_id: contactId }] });
      await queryClient.cancelQueries({ queryKey: [ARTIFACTS_TABLE, 'list'] }); // Cancel general lists too
      await queryClient.cancelQueries({ queryKey: [ARTIFACTS_TABLE, 'detail', deletedArtifactId]});

      let previousArtifactsForContact: Artifact[] | undefined;

      if (contactId) {
        previousArtifactsForContact = queryClient.getQueryData<Artifact[]>([ARTIFACTS_TABLE, { contact_id: contactId }]);
        if (previousArtifactsForContact) {
          queryClient.setQueryData<Artifact[]>(
            [ARTIFACTS_TABLE, { contact_id: contactId }],
            previousArtifactsForContact.filter(artifact => artifact.id !== deletedArtifactId)
          );
        }
      }
      // It's harder to optimistically update a general 'list' without knowing its exact structure or filters.
      // Relying on invalidation for general lists is often more practical.

      return { previousArtifactsForContact, contactId };
    },
    onError: (err, variables, context) => {
      console.error('Error deleting artifact:', err);
      if (context?.previousArtifactsForContact && context.contactId) {
        queryClient.setQueryData([ARTIFACTS_TABLE, { contact_id: context.contactId }], context.previousArtifactsForContact);
      }
      // If err has a specific code like ARTIFACT_IS_SOURCE, the UI can use it for specific messaging.
      // Example: if ((err as any).code === 'ARTIFACT_IS_SOURCE') { /* show specific message */ }
    },
    onSettled: (data, error, { id: deletedArtifactId, contactId }) => {
      // Invalidate all queries related to artifacts to ensure data consistency
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE, { contact_id: contactId }] });
      }
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE, 'list'] });
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE] }); // Broadest invalidation as a fallback

      // Remove the specific artifact detail query from cache if it exists
      queryClient.removeQueries({ queryKey: [ARTIFACTS_TABLE, 'detail', deletedArtifactId] });
    },
  });

  return {
    createArtifact: createArtifactMutation.mutateAsync,
    isCreatingArtifact: createArtifactMutation.isPending,
    createArtifactError: createArtifactMutation.error,

    deleteArtifact: deleteArtifactMutation.mutateAsync,
    isDeletingArtifact: deleteArtifactMutation.isPending,
    deleteArtifactError: deleteArtifactMutation.error,
  };
}; 