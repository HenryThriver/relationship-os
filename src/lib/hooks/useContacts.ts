import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Contact } from '@/types';

// Assuming your Supabase table is named 'contacts'
const CONTACTS_TABLE = 'contacts';

export const useContacts = () => {
  const queryClient = useQueryClient();

  // Fetch all contacts
  const getContacts = async (): Promise<Contact[]> => {
    const { data, error } = await supabase.from(CONTACTS_TABLE).select('*');
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: contacts, isLoading: isLoadingContacts, error: contactsError } = useQuery<Contact[]>({
    queryKey: [CONTACTS_TABLE],
    queryFn: getContacts,
  });

  // Fetch a single contact by ID
  const getContactById = async (id: string): Promise<Contact | null> => {
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      // Handle cases where the contact is not found gracefully for the query hook
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  };

  // Prefetch a contact - useful for hover effects or navigating to detail page
  const prefetchContact = async (id: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: [CONTACTS_TABLE, id],
      queryFn: () => getContactById(id),
    });
  };
  
  // Create a new contact
  const createContact = async (linkedinUrl: string): Promise<Contact> => {
    // For now, we'll just use the LinkedIn URL.
    // In the future, we can add parsing logic here or in a Supabase Edge Function.
    const newContactPartial: Pick<Contact, 'linkedin_url'> = { linkedin_url: linkedinUrl };
    
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .insert(newContactPartial as any) // Cast to any to avoid full Contact type requirement for insert
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Contact creation failed, no data returned.');
    return data;
  };

  const createContactMutation = useMutation<Contact, Error, string>({
    mutationFn: createContact,
    onSuccess: (newContact) => {
      // Invalidate and refetch all contacts
      queryClient.invalidateQueries({ queryKey: [CONTACTS_TABLE] });
      // Optionally, update the cache directly if preferred
      // queryClient.setQueryData([CONTACTS_TABLE], (oldData: Contact[] | undefined) => [...(oldData || []), newContact]);
      // Also update the specific contact query if it exists
      queryClient.setQueryData([CONTACTS_TABLE, newContact.id], newContact);
    },
  });

  // Update an existing contact
  const updateContact = async (updatedContact: Partial<Contact> & Pick<Contact, 'id'>): Promise<Contact> => {
    const { id, ...updateData } = updatedContact;
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Contact update failed, no data returned.');
    return data;
  };

  const updateContactMutation = useMutation<Contact, Error, Partial<Contact> & Pick<Contact, 'id'>>({
    mutationFn: updateContact,
    onSuccess: (updatedContact) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_TABLE] });
      queryClient.setQueryData([CONTACTS_TABLE, updatedContact.id], updatedContact);
    },
  });

  // Delete a contact
  const deleteContact = async (id: string): Promise<void> => {
    const { error } = await supabase.from(CONTACTS_TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  };

  const deleteContactMutation = useMutation<void, Error, string>({
    mutationFn: deleteContact,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_TABLE] });
      // Remove the specific contact query from cache
      queryClient.removeQueries({ queryKey: [CONTACTS_TABLE, id] });
    },
  });

  return {
    // Queries
    contacts,
    isLoadingContacts,
    contactsError,
    getContactById, // Exposing this for direct use if needed, e.g. in server components or other hooks
    prefetchContact,

    // Mutations
    createContact: createContactMutation.mutateAsync,
    isCreatingContact: createContactMutation.isPending,
    createContactError: createContactMutation.error,
    
    updateContact: updateContactMutation.mutateAsync,
    isUpdatingContact: updateContactMutation.isPending,
    updateContactError: updateContactMutation.error,

    deleteContact: deleteContactMutation.mutateAsync,
    isDeletingContact: deleteContactMutation.isPending,
    deleteContactError: deleteContactMutation.error,
  };
}; 