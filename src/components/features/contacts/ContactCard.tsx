'use client';

import React from 'react';
import Link from 'next/link';
import { Contact } from '@/types';
import { Card, CardContent, Typography, CardActions, Button, Box } from '@mui/material';
import { useContacts } from '@/lib/hooks/useContacts';

interface ContactCardProps {
  contact: Contact;
}

export const ContactCard = ({ contact }: ContactCardProps) => {
  const { deleteContact, isDeletingContact } = useContacts();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contact.id);
        alert('Contact deleted successfully'); // Replace with a more subtle notification
      } catch (error) {
        console.error('Failed to delete contact:', error);
        alert('Failed to delete contact'); // Replace with a more subtle notification
      }
    }
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {contact.name || 'Unnamed Contact'} 
        </Typography>
        {contact.email && (
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            {contact.email}
          </Typography>
        )}
        <Typography variant="body2">
          LinkedIn: <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">{contact.linkedin_url}</a>
        </Typography>
        <Typography variant="caption" display="block" sx={{mt: 1}}>
          ID: {contact.id}
        </Typography>
         <Typography variant="caption" display="block">
          Added: {new Date(contact.created_at).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={`/contacts/${contact.id}`} passHref>
          <Button size="small">View Details</Button>
        </Link>
        <Button size="small" color="error" onClick={handleDelete} disabled={isDeletingContact}>
          {isDeletingContact ? 'Deleting...' : 'Delete'}
        </Button>
      </CardActions>
    </Card>
  );
}; 