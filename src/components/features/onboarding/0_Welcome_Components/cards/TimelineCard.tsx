'use client';

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

export const TimelineCard: React.FC = () => {
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
          <Box 
            sx={{ 
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(63, 81, 181, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              fontSize: '1.1rem'
            }}
          >
            📅
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Coffee Meeting
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              2 days ago with Jennifer Kim
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4, mb: 1.5 }}>
          Discussed product strategy and market positioning. Jennifer offered intro to her design lead.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Box 
            sx={{ 
              px: 1, 
              py: 0.3, 
              bgcolor: 'rgba(76, 175, 80, 0.1)', 
              borderRadius: 1
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#4CAF50' }}>
              Follow-up sent
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box 
            sx={{ 
              width: 4, 
              height: 4, 
              borderRadius: '50%', 
              bgcolor: '#2196F3' 
            }} 
          />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Next: Intro to design team
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 