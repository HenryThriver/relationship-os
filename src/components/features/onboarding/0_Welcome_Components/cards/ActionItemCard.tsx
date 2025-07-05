'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';

export const ActionItemCard: React.FC = () => {
  return (
    <Card 
      sx={{ 
        opacity: 0.6, 
        width: 260,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box 
            sx={{ 
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              fontSize: '1.2rem'
            }}
          >
            🤝
          </Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Action Item
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4, mb: 1.5 }}>
          Introduce Sarah to Mike Rodriguez (YC founder) - mutual interest in AI startups
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label="High Priority" 
            color="primary" 
            size="small" 
            sx={{ 
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-label': {
                px: 1
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Due: 2 days
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 