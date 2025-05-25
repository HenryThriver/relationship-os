'use client'; // Or remove if not directly using client hooks/state here

import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { AddContactForm } from '@/components/features/contacts/AddContactForm';
import { ContactList } from '@/components/features/contacts/ContactList';
import Link from 'next/link';

export default function ContactsPage() {
  // const router = useRouter(); // If navigation after add is needed from here

  // const handleContactAdded = (contactId: string) => {
  //   // Optionally navigate to the new contact's detail page or refresh list
  //   // router.push(`/contacts/${contactId}`);
  //   console.log('Contact added, ID:', contactId);
  // };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contact Management
        </Typography>
        <Link href="/contacts/new" passHref>
          <Button variant="contained" color="primary">
            Add New Contact
          </Button>
        </Link>
      </Box>

      {/* We can place the AddContactForm on a separate page /contacts/new 
          or include it here, perhaps in a modal or expandable section.
          For now, per instructions, /contacts/new is a separate page.
      */}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          All Contacts
        </Typography>
        <ContactList />
      </Paper>

    </Container>
  );
} 