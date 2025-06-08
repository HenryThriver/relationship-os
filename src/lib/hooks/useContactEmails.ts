import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ContactEmail, ContactEmailFormData, EmailValidationResult } from '@/types/contact';
import { useToast } from '@/lib/contexts/ToastContext';

// Helper function to cast database row to ContactEmail type
const castToContactEmail = (item: any): ContactEmail => ({
  ...item,
  email_type: (item.email_type || 'other') as 'primary' | 'work' | 'personal' | 'other',
  is_primary: item.is_primary || false,
  verified: item.verified || false,
  created_at: item.created_at || new Date().toISOString(),
  updated_at: item.updated_at || new Date().toISOString()
});

export const useContactEmails = (contactId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch contact emails
  const {
    data: emails,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['contact-emails', contactId],
    queryFn: async (): Promise<ContactEmail[]> => {
      const { data, error } = await supabase
        .from('contact_emails')
        .select('*')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(castToContactEmail);
    },
    enabled: !!contactId,
  });

  // Add email mutation
  const addEmailMutation = useMutation({
    mutationFn: async (emailData: ContactEmailFormData): Promise<ContactEmail> => {
      const { data, error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contactId,
          ...emailData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newEmail) => {
      queryClient.invalidateQueries({ queryKey: ['contact-emails', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
      showToast(
        `${newEmail.email} added successfully`,
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(
        error.message || 'Failed to add email',
        'error'
      );
    },
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ 
      emailId, 
      updates 
    }: { 
      emailId: string; 
      updates: Partial<ContactEmailFormData> 
    }): Promise<ContactEmail> => {
      const { data, error } = await supabase
        .from('contact_emails')
        .update(updates)
        .eq('id', emailId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-emails', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
      showToast(
        'Email updated successfully',
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(
        error.message || 'Failed to update email',
        'error'
      );
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string): Promise<void> => {
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-emails', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
      showToast(
        'Email removed successfully',
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(
        error.message || 'Failed to remove email',
        'error'
      );
    },
  });

  // Set primary email mutation
  const setPrimaryEmailMutation = useMutation({
    mutationFn: async (emailId: string): Promise<ContactEmail> => {
      const { data, error } = await supabase
        .from('contact_emails')
        .update({ is_primary: true })
        .eq('id', emailId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-emails', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] });
      showToast(
        'Primary email updated',
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(
        error.message || 'Failed to set primary email',
        'error'
      );
    },
  });

  return {
    emails: emails || [],
    isLoading,
    isError,
    refetch,
    addEmail: addEmailMutation.mutate,
    updateEmail: updateEmailMutation.mutate,
    deleteEmail: deleteEmailMutation.mutate,
    setPrimaryEmail: setPrimaryEmailMutation.mutate,
    isAddingEmail: addEmailMutation.isPending,
    isUpdatingEmail: updateEmailMutation.isPending,
    isDeletingEmail: deleteEmailMutation.isPending,
    isSettingPrimary: setPrimaryEmailMutation.isPending,
  };
};

// Email validation utility
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}; 