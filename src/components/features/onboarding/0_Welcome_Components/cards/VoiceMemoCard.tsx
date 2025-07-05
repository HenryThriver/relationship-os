'use client';

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

const WaveformVisualization: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, height: 20 }}>
      {[12, 8, 15, 6, 18, 4, 14, 9, 11, 7, 16, 5, 13, 10].map((height, index) => (
        <Box
          key={index}
          sx={{
            width: 2,
            height: `${height}px`,
            bgcolor: '#2196F3',
            borderRadius: 1,
            opacity: 0.7,
            animation: `wave-pulse 2s ease-in-out infinite ${index * 0.1}s`,
            '@keyframes wave-pulse': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 0.8 }
            }
          }}
        />
      ))}
    </Box>
  );
};

export const VoiceMemoCard: React.FC = () => {
  return (
    <Card 
      sx={{ 
        opacity: 0.6, 
        width: 270,
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
              bgcolor: 'rgba(156, 39, 176, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              fontSize: '1.1rem'
            }}
          >
            🎤
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Voice Memo
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              2 minutes ago
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 1.5, py: 1 }}>
          <WaveformVisualization />
        </Box>
        
        <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4, fontStyle: 'italic' }}>
          "Met Alex at the conference - he's launching an AI startup focused on healthcare automation..."
        </Typography>
        
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Box 
            sx={{ 
              px: 1, 
              py: 0.3, 
              bgcolor: 'rgba(156, 39, 176, 0.1)', 
              borderRadius: 1,
              fontSize: '0.7rem'
            }}
          >
            <Typography variant="caption" color="secondary">
              Auto-parsed
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 