// This is a Next.js Page component. 
// It extracts the [id] parameter from the route and passes it to a client component.

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { ContactDetailClient } from '@/components/features/contacts/ContactDetailClient';

interface ContactDetailPageProps {
  params: {
    id: string; // The [id] part of the URL
  };
  // searchParams could also be used if needed
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = params;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Contact Details
        </Typography>
        {/* Optional: Add a button to go back or to edit page */}
      </Box>
      <ContactDetailClient contactId={id} />
    </Container>
  );
}

// Optional: Add generateStaticParams if you want to pre-render some contact pages at build time
// export async function generateStaticParams() {
//   // const contacts = await fetch('...').then((res) => res.json()) // Fetch contacts
//   // return contacts.map((contact) => ({ id: contact.id.toString() }))
//   return []; // For now, no pre-rendering
// } 