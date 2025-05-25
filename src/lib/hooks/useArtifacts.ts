import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types_db';

// Define the type for a new artifact based on your DB schema
// This should align with Tables<"artifacts">["Insert"] from types_db.ts
export type NewArtifact = Database['public']['Tables']['artifacts']['Insert'];
export type Artifact = Database['public']['Tables']['artifacts']['Row'];

const ARTIFACTS_TABLE = 'artifacts';

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
      // Invalidate queries related to artifacts, e.g., a list of artifacts for a contact
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE, { contact_id: newArtifactData.contact_id }] });
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_TABLE] }); // Or a more general invalidation
      
      // Optionally, update the cache directly
      // queryClient.setQueryData([ARTIFACTS_TABLE, { contact_id: newArtifactData.contact_id }], (oldData: Artifact[] | undefined) => [...(oldData || []), newArtifactData]);
    },
    onError: (error) => {
      console.error('Mutation error creating artifact:', error);
      // Potentially show a user-facing error notification here
    }
  });

  return {
    createArtifact: createArtifactMutation.mutateAsync,
    isCreatingArtifact: createArtifactMutation.isPending,
    createArtifactError: createArtifactMutation.error,
    // Add functions for fetching/updating/deleting artifacts here later if needed
  };
}; 