'use client';

import React, { useState } from 'react';
import { useContacts } from '@/lib/hooks/useContacts';
import { Button, TextField, Box, Typography, CircularProgress, Alert } from '@mui/material';

interface AddContactFormProps {
  onSuccess?: (contactId: string) => void; // Callback on successful creation
}

export const AddContactForm = ({ onSuccess }: AddContactFormProps) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const { createContact, isCreatingContact, createContactError } = useContacts();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!linkedinUrl.trim()) {
      // Basic validation, can be expanded
      alert('LinkedIn URL cannot be empty.');
      return;
    }
    try {
      const newContact = await createContact(linkedinUrl);
      setLinkedinUrl('');
      if (onSuccess) {
        onSuccess(newContact.id);
      }
      // Optionally, navigate or show a success message here
      alert('Contact created successfully!'); // Placeholder
    } catch (error) {
      // Error is already available via createContactError from the hook
      // but you might want to log it or handle it specifically here too.
      console.error('Failed to create contact:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Add New Contact
      </Typography>
      <TextField
        label="LinkedIn Profile URL"
        variant="outlined"
        fullWidth
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        required
        disabled={isCreatingContact}
        sx={{ mb: 2 }}
      />
      {createContactError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {createContactError.message}
        </Alert>
      )}
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        disabled={isCreatingContact}
        fullWidth
      >
        {isCreatingContact ? <CircularProgress size={24} /> : 'Add Contact'}
      </Button>
    </Box>
  );
}; 