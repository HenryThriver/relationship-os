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
  Stack,
  // Card, // Unused
  // CardContent, // Unused
  // IconButton // Unused
} from '@mui/material';
import { Add as AddIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useContacts } from '@/lib/hooks/useContacts'; // Assuming this is the correct path
import { BulkEmailActions } from '@/components/features/emails/BulkEmailActions';
import type { Contact } from '@/types'; // Assuming this is the correct path for the Contact type
import { LinkedInProfileData } from '@/types/linkedin';
import { useTouchFriendlySize, useIsMobile } from '@/lib/hooks/useMobile';
import { responsive, getResponsiveDirection } from '@/lib/utils/mobileDesign';

export default function ContactsPage(): React.JSX.Element {
  console.log('[src/app/dashboard/contacts/page.tsx] Rendering');
  const { contacts, isLoadingContacts, contactsError } = useContacts();
  const touchFriendly = useTouchFriendlySize();
  const isMobile = useIsMobile();

  // Transform contacts for bulk email actions
  const contactsForBulkSync = contacts?.map(contact => {
    const nameParts = (contact.name || '').split(' ');
    return {
      id: contact.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email_addresses: contact.email ? [contact.email] : [],
    };
  }) || [];

  const handleBulkSync = async (contactIds: string[]) => {
    // TODO: Implement actual bulk sync API call
    console.log('Bulk syncing contacts:', contactIds);
    
    // For now, just simulate the API calls
    for (const contactId of contactIds) {
      await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          email_addresses: contactsForBulkSync.find(c => c.id === contactId)?.email_addresses || [],
          date_range: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          max_results: 100,
        }),
      });
    }
  };

  return (
    <Box sx={{ pb: responsive(3, 4) }}>
      <Box
        sx={{
          mb: responsive(2, 3),
          mt: 1
        }}
      >
        <Box sx={{ mb: responsive(2, 3) }}>
          <Typography 
            variant={touchFriendly.headerVariant as 'h4' | 'h5'} 
            component="h1" 
            sx={{ fontWeight: 'bold' }}
          >
            Contacts
          </Typography>
          <Typography 
            variant="body2"
            sx={{ fontSize: responsive('0.875rem', '1rem') }}
            color="text.secondary"
          >
            Manage your relationship network
          </Typography>
        </Box>
        
        <Stack 
          direction={getResponsiveDirection('column', 'row')}
          spacing={responsive(1, 2)}
          alignItems={isMobile ? 'stretch' : 'center'}
          justifyContent={isMobile ? 'flex-start' : 'flex-end'}
        >
          <BulkEmailActions
            contacts={contactsForBulkSync}
            onBulkSync={handleBulkSync}
          />
          <Link href="/dashboard/contacts/new" passHref>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size={touchFriendly.buttonSize as 'medium' | 'large'}
              fullWidth={isMobile}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '0.5rem',
                minHeight: touchFriendly.minTouchTarget
              }}
            >
              Add Contact
            </Button>
          </Link>
        </Stack>
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
        <Paper elevation={0} sx={{ 
          borderRadius: responsive('0.5rem', '0.75rem'), 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', 
          backgroundColor: 'white'
        }}>
          <List disablePadding>
            {contacts.map((contact: Contact, index: number) => (
              <React.Fragment key={contact.id}>
                <ListItem
                  component={Link}
                  href={`/dashboard/contacts/${contact.id}`}
                  sx={{ 
                    padding: responsive('0.75rem 1rem', '1rem 1.5rem'),
                    minHeight: touchFriendly.minTouchTarget,
                    '&:hover': { backgroundColor: 'action.hover' },
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={(contact.linkedin_data as LinkedInProfileData)?.profilePicture || undefined} >
                      {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.name || 'Unnamed Contact'}
                    secondary={contact.company || contact.email || 'No additional details'}
                    primaryTypographyProps={{ 
                      fontWeight: '500', 
                      color: 'text.primary',
                      variant: 'body1',
                      sx: { fontSize: responsive('0.875rem', '1rem') }
                    }}
                    secondaryTypographyProps={{ 
                      color: 'text.secondary', 
                      fontSize: responsive('0.75rem', '0.875rem')
                    }}
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
            p: responsive(3, 5), 
            textAlign: 'center', 
            borderRadius: responsive('0.5rem', '0.75rem'), 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', 
            backgroundColor: 'white'
          }}
        >
          <Typography 
            variant="h6"
            sx={{ 
              color: 'text.secondary',
              fontSize: responsive('1.125rem', '1.25rem')
            }}
            gutterBottom 
          >
            No contacts yet
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              mb: responsive(2, 3), 
              color: 'text.secondary',
              fontSize: responsive('0.875rem', '1rem')
            }}
          >
            Start building your relationship network by adding your first contact.
          </Typography>
          <Link href="/dashboard/contacts/new" passHref>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size={touchFriendly.buttonSize as 'medium' | 'large'}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '0.5rem',
                minHeight: touchFriendly.minTouchTarget
              }}
            >
              Add Your First Contact
            </Button>
          </Link>
        </Paper>
      )}
    </Box>
  );
} 