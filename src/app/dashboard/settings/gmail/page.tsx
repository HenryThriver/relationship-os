'use client';

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  Paper,
} from '@mui/material';
import { GmailConnectionCard } from '@/components/features/emails';

export default function GmailSettingsPage(): React.JSX.Element {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gmail Integration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Connect your Gmail account to automatically sync email conversations with your contacts.
          This creates a complete timeline of your relationship history.
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <GmailConnectionCard />
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Privacy Note:</strong> Connection OS only reads your emails to sync with existing contacts. 
            We never store your email content permanently - only relationship insights and conversation summaries.
          </Typography>
        </Alert>

        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Beta Feature:</strong> Gmail integration is currently in beta. 
            Please report any issues or feedback to help us improve the experience.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
} 