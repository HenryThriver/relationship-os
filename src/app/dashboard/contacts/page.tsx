'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  // Card, // Unused
  // CardContent, // Unused
  // IconButton // Unused
} from '@mui/material';
import { Add as AddIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useContacts } from '@/lib/hooks/useContacts'; // Assuming this is the correct path
import type { Contact } from '@/types'; // Assuming this is the correct path for the Contact type

export default function ContactsPage(): React.JSX.Element {
  console.log('[src/app/dashboard/contacts/page.tsx] Rendering');
  const { contacts, isLoadingContacts, contactsError } = useContacts();

  return (
    <Box sx={{pb: 4}}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          mt: 1
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Contacts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your relationship network
          </Typography>
        </Box>
        <Link href="/dashboard/contacts/new" passHref>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            sx={{ textTransform: 'none', borderRadius: '0.5rem' }}
          >
            Add Contact
          </Button>
        </Link>
      </Box>

      {isLoadingContacts && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      )}

      {contactsError && (
        <Alert severity="error" sx={{ my: 2 }}>
          Failed to load contacts: {contactsError instanceof Error ? contactsError.message : String(contactsError)}
        </Alert>
      )}

      {!isLoadingContacts && !contactsError && contacts && contacts.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', backgroundColor: 'white'}}>
          <List disablePadding>
            {contacts.map((contact: Contact, index: number) => (
              <React.Fragment key={contact.id}>
                <ListItem
                  component={Link}
                  href={`/dashboard/contacts/${contact.id}`}
                  sx={{ 
                    padding: '1rem 1.5rem', 
                    '&:hover': { backgroundColor: 'action.hover' },
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={contact.profile_photo_url || undefined} >
                      {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.name || 'Unnamed Contact'}
                    secondary={contact.company || contact.email || 'No additional details'}
                    primaryTypographyProps={{ fontWeight: '500', color: 'text.primary' }}
                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                  />
                  <ChevronRightIcon sx={{color: 'text.disabled'}} />
                </ListItem>
                {index < contacts.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {!isLoadingContacts && !contactsError && (!contacts || contacts.length === 0) && (
        <Paper 
          elevation={0}
          sx={{ 
            p: {xs:3, md:5}, 
            textAlign: 'center', 
            borderRadius: '0.75rem', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', 
            backgroundColor: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{color: 'text.secondary'}}>
            No contacts yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Start building your relationship network by adding your first contact.
          </Typography>
          <Link href="/dashboard/contacts/new" passHref>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              sx={{ textTransform: 'none', borderRadius: '0.5rem' }}
            >
              Add Your First Contact
            </Button>
          </Link>
        </Paper>
      )}
    </Box>
  );
} 