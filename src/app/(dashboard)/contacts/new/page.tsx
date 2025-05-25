'use client';

import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { AddContactForm } from '@/components/features/contacts/AddContactForm';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import Link from 'next/link';
import Button from '@mui/material/Button';

export default function NewContactPage() {
  const router = useRouter();

  const handleSuccess = (contactId: string) => {
    // Navigate to the main contacts list or the new contact's detail page
    router.push('/contacts'); 
    // Optionally: router.push(`/contacts/${contactId}`);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Contact
        </Typography>
        <Link href="/contacts" passHref>
          <Button variant="outlined">Back to Contacts</Button>
        </Link>
      </Box>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <AddContactForm onSuccess={handleSuccess} />
      </Paper>
    </Container>
  );
} 