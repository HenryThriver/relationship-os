'use client';

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface RelationshipSessionInterfaceProps {
  sessionId: string;
  onClose: () => void;
}

export const RelationshipSessionInterface: React.FC<RelationshipSessionInterfaceProps> = ({
  sessionId,
}) => {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Relationship Session
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Session ID: {sessionId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature is temporarily disabled for deployment. Full functionality will be restored shortly.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};