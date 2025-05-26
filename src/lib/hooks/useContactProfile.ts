import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client'; // Assuming supabase client is here
import type { Contact, ProfessionalContext, PersonalContext, LinkedInArtifactContent, ConversationStarters } from '@/types';
import type { Json } from '@/lib/supabase/types_db'; // Ensure Json is imported if not already

// Placeholder for Supabase API functions. These would typically be in a separate file e.g., src/lib/supabase/contactsApi.ts
// For demonstration, they are sketched here.

const CONTACTS_TABLE = 'contacts';

/**
 * Fetches a single contact by ID, including its context fields.
 * This function would typically live in a Supabase API service file.
 */
async function fetchContactWithContext(contactId: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from(CONTACTS_TABLE)
    .select('*') // Select all columns, including new JSONB fields
    .eq('id', contactId)
    .single();

  if (error) {
    console.error('Error fetching contact with context:', error);
    throw new Error(error.message);
  }
  return data as Contact | null; // Assumes DB schema matches Contact type
}

/**
 * Updates a specific JSONB context field for a contact.
 * This function would typically live in a Supabase API service file.
 */
async function updateContactContext<K extends 'professional_context' | 'personal_context' | 'linkedin_data'>(
  contactId: string, 
  contextField: K,
  updates: K extends 'professional_context' ? Partial<ProfessionalContext> :
           K extends 'personal_context' ? Partial<PersonalContext> :
           K extends 'linkedin_data' ? Partial<LinkedInArtifactContent> :
           never
): Promise<Contact | null> {
  // Fetch only the specific context field to be updated
  const { data: existingContactWrapper, error: fetchError } = await supabase
    .from(CONTACTS_TABLE)
    .select(contextField) // Only select the field to be updated
    .eq('id', contactId)
    .single();

  if (fetchError || !existingContactWrapper) {
    console.error('Error fetching existing context for update:', fetchError);
    throw new Error(fetchError?.message || 'Failed to fetch existing context for update');
  }

  // existingContactWrapper will be an object like { [contextField]: { ... actual context data ... } }
  // or { [contextField]: null } if the field is null in the DB.
  const currentContextData = (existingContactWrapper as Record<K, any>)[contextField] || {};
  const newContext = { ...currentContextData, ...updates };

  const { data, error } = await supabase
    .from(CONTACTS_TABLE)
    .update({ [contextField]: newContext })
    .eq('id', contactId)
    .select() // Select all fields of the updated contact
    .single();

  if (error) {
    console.error(`Error updating ${contextField}:`, error);
    throw new Error(error.message);
  }
  return data as Contact | null;
}

// --- React Query Hook --- 

export const useContactProfile = (contactId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ['contact-profile', contactId];

  // Fetch complete contact profile
  const { data: contact, isLoading, error: queryError } = useQuery<Contact | null, Error>({
    queryKey: queryKey,
    queryFn: () => contactId ? fetchContactWithContext(contactId) : Promise.resolve(null),
    enabled: !!contactId, // Only run query if contactId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update professional context
  const updateProfessionalContextMutation = useMutation<
    Contact | null, 
    Error, 
    Partial<ProfessionalContext>
  >({
    mutationFn: (updates) => 
      updateContactContext(contactId!, 'professional_context', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
        console.error('Failed to update professional context:', error);
    }
  });

  // Update personal context  
  const updatePersonalContextMutation = useMutation<
    Contact | null, 
    Error, 
    Partial<PersonalContext>
  >({
    mutationFn: (updates) => 
      updateContactContext(contactId!, 'personal_context', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
        console.error('Failed to update personal context:', error);
    }
  });

  // Add conversation starter (example of more complex context update)
  // This specific mutation might be better if it directly calls a Supabase function that handles the array append atomically.
  // For simplicity here, it reads then writes, which is not ideal for concurrent updates.
  const addConversationStarterMutation = useMutation<
    Contact | null,
    Error,
    { type: 'personal' | 'professional'; starter: string }
  >({
    mutationFn: async ({ type, starter }) => {
      if (!contact) throw new Error('Contact data not available for adding conversation starter');
      if (!contactId) throw new Error('Contact ID not available');

      // Cast personal_context (which is Json) to PersonalContext to access its properties
      const personalCtx = contact.personal_context as PersonalContext | null | undefined;
      
      // Conversation starters are always within PersonalContext
      const currentStarters = personalCtx?.conversation_starters || { personal: [], professional: [] }; // Ensure proper default for ConversationStarters
      const specificTypeStarters = currentStarters[type] || [];
      
      const updates: Partial<PersonalContext> = {
        conversation_starters: {
          ...currentStarters,
          [type]: [...specificTypeStarters, starter]
        }
      };
      
      // updateContactContext expects Partial<PersonalContext>, which `updates` is.
      // The actual DB field `personal_context` will be updated with this JSON data.
      return updateContactContext(contactId, 'personal_context', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
        console.error('Failed to add conversation starter:', error);
    }
  });

  return {
    contact,
    isLoading,
    error: queryError,
    updateProfessionalContext: updateProfessionalContextMutation.mutateAsync,
    isUpdatingProfessionalContext: updateProfessionalContextMutation.isPending,
    updatePersonalContext: updatePersonalContextMutation.mutateAsync,
    isUpdatingPersonalContext: updatePersonalContextMutation.isPending,
    addConversationStarter: addConversationStarterMutation.mutateAsync,
    isAddingConversationStarter: addConversationStarterMutation.isPending,
  };
}; 