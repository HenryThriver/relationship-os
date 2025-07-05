'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

export const ContactProfileCard: React.FC = () => {
  return (
    <Card 
      sx={{ 
        opacity: 0.6, 
        width: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              bgcolor: '#2196F3',
              fontSize: '1.2rem'
            }}
          >
            SC
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
              Sarah Chen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              VP Product at TechCorp
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
          Connected through Stanford MBA program. Expertise in AI/ML products and scaling product teams...
        </Typography>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Box 
            sx={{ 
              px: 1, 
              py: 0.5, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              borderRadius: 1,
              fontSize: '0.7rem'
            }}
          >
            <Typography variant="caption" color="primary">
              AI/ML
            </Typography>
          </Box>
          <Box 
            sx={{ 
              px: 1, 
              py: 0.5, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              borderRadius: 1,
              fontSize: '0.7rem'
            }}
          >
            <Typography variant="caption" color="primary">
              Product
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 