'use client';

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

export const GoalCelebrationCard: React.FC = () => {
  return (
    <Card 
      sx={{ 
        opacity: 0.9, 
        width: 350,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(76, 175, 80, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              fontSize: '1.2rem'
            }}
          >
            🎉
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#4CAF50' }}>
              Goal Achieved!
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Major Contract Secured
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500, mb: 0.5 }}>
            Signed a $1.5M contract with target client
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Through meaningful connections cultivated over 6 months
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[...Array(3)].map((_, i) => (
              <Box 
                key={i}
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#4CAF50',
                  animation: `celebration-pulse 1.5s ease-in-out infinite ${i * 0.2}s`,
                  '@keyframes celebration-pulse': {
                    '0%, 100%': { 
                      transform: 'scale(1)',
                      opacity: 0.7
                    },
                    '50%': { 
                      transform: 'scale(1.3)',
                      opacity: 1
                    }
                  }
                }} 
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 600 }}>
            Mission Accomplished
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 