'use client';

import React from 'react';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { LoopTemplatesManager } from '@/components/features/loops/LoopTemplatesManager';
import NextLink from 'next/link';

export default function LoopSettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link component={NextLink} href="/dashboard" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Link component={NextLink} href="/dashboard/settings" underline="hover" color="inherit">
            Settings
          </Link>
          <Typography color="text.primary">Loop Templates</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Loop Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your loop templates to streamline relationship management workflows.
            Templates help you quickly create consistent loops for common scenarios like introductions, referrals, and follow-ups.
          </Typography>
        </Box>

        {/* Loop Templates Manager */}
        <LoopTemplatesManager />
      </Box>
    </Container>
  );
} 