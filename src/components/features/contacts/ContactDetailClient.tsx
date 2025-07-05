'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContacts } from '@/lib/hooks/useContacts';
import { Contact } from '@/types';
import { Typography, Box, CircularProgress, Alert, Paper, Button } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ContactDetailClientProps {
  contactId: string;
}

export const ContactDetailClient = ({ contactId }: ContactDetailClientProps) => {
  const { getContactById, deleteContact, isDeletingContact } = useContacts();
  const router = useRouter();

  const { data: contact, isLoading, error, refetch } = useQuery<Contact | null>({
    queryKey: ['contacts', contactId],
    queryFn: () => getContactById(contactId),
    enabled: !!contactId, // Only run query if contactId is available
  });

  const handleDelete = async () => {
    if (contact && window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contact.id);
        alert('Contact deleted successfully');
        router.push('/contacts');
      } catch (err) {
        console.error('Failed to delete contact:', err);
        alert('Failed to delete contact. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading contact: {error.message}
        <Button onClick={() => refetch()} sx={{ml: 2}}>Retry</Button>
      </Alert>
    );
  }

  if (!contact) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Contact not found.
        <Link href="/contacts" passHref>
          <Button component="a" sx={{ml:2}}>Go to Contacts</Button>
        </Link>
      </Alert>
    );
  }

  // TODO: Add an EditContactForm component and functionality later
  // For now, just displaying details.

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {contact.name || 'Contact Details'}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1"><strong>ID:</strong> {contact.id}</Typography>
        <Typography variant="subtitle1"><strong>LinkedIn URL:</strong> 
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
            {contact.linkedin_url}
          </a>
        </Typography>
        <Typography variant="subtitle1"><strong>Email:</strong> {contact.email || 'N/A'}</Typography>
        <Typography variant="subtitle1"><strong>Name (from profile):</strong> {contact.name || 'N/A - will be populated after scraping'}</Typography>
        <Typography variant="subtitle1"><strong>Created At:</strong> {new Date(contact.created_at).toLocaleString()}</Typography>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2}}> 
        <Link href={`/contacts`} passHref>
            <Button variant="outlined">Back to List</Button>
        </Link>
        {/* <Link href={`/contacts/${contact.id}/edit`} passHref>
          <Button variant="contained" color="primary">Edit</Button> // Placeholder for edit functionality
        </Link> */}
        <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeletingContact}>
          {isDeletingContact ? <CircularProgress size={24}/> : 'Delete Contact'}
        </Button>
      </Box>
    </Paper>
  );
}; 