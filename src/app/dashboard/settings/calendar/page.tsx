'use client';

import React from 'react';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import NextLink from 'next/link';
import { CalendarSyncDashboard } from '@/components/features/meetings/CalendarSyncDashboard';

export default function CalendarSettingsPage() {
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
          <Typography color="text.primary">Calendar Integration</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarToday sx={{ fontSize: 40 }} color="primary" />
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Calendar Integration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect your Google Calendar to automatically import meetings as relationship artifacts
            </Typography>
          </Box>
        </Box>

        {/* Calendar Sync Dashboard */}
        <CalendarSyncDashboard />
      </Box>
    </Container>
  );
} 