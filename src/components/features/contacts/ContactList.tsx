'use client';

import React from 'react';
import { useContacts } from '@/lib/hooks/useContacts';
import { ContactCard } from './ContactCard';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

export const ContactList = () => {
  const { contacts, isLoadingContacts, contactsError } = useContacts();

  if (isLoadingContacts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (contactsError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading contacts: {contactsError.message}
      </Alert>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
        No contacts found. Add your first contact!
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Your Contacts
      </Typography>
      <Box 
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {contacts.map((contact) => (
          <Box 
            key={contact.id} 
            sx={{ 
              width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
            }}
          >
            <ContactCard contact={contact} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}; 