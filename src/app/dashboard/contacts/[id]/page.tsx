'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// import { useContacts } from '@/lib/hooks/useContacts'; // We'll need this later to fetch contact details

interface ContactDetailPageProps {
  // No specific props needed if ID is from params
}

export default function ContactDetailPage({}: ContactDetailPageProps): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;

  // const { getContactById, isLoadingContact, contactError } = useContacts(); // Placeholder for fetching
  // const [contact, setContact] = React.useState<any | null>(null); // Placeholder for contact data

  // React.useEffect(() => {
  //   if (id) {
  //     // Fetch contact data using id
  //     // getContactById(id).then(setContact);
  //     console.log("Fetching contact with ID:", id);
  //   }
  // }, [id, getContactById]);

  if (!id) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Contact ID not found in URL.</Alert>
      </Container>
    );
  }
  
  // if (isLoadingContact) { 
  //   return <Box sx={{display: 'flex', justifyContent: 'center', my:5}}><CircularProgress /></Box>
  // }

  // if (contactError) {
  //   return <Alert severity="error">Error loading contact: {contactError.message}</Alert>
  // }

  // if (!contact && !isLoadingContact) {
  //   return <Alert severity="info">Contact not found.</Alert>
  // }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contact Details
        </Typography>
        <Link href="/dashboard/contacts" passHref>
          <Button variant="outlined">Back to Contacts List</Button>
        </Link>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {/* Placeholder: Display contact name here later */}
          Contact ID: {id}
        </Typography>
        <Typography variant="body1">
          More contact details will be displayed here soon.
        </Typography>
        {/* Further details, related artifacts, etc. */}
      </Paper>
    </Container>
  );
} 