'use client';

import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress } from '@mui/material';

export const GoalProgressCard: React.FC = () => {
  return (
    <Card 
      sx={{ 
        opacity: 0.6, 
        width: 250,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              fontSize: '1rem'
            }}
          >
            🎯
          </Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Land Series A
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Investor Connections
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
              65%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={65} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#FF9800',
                borderRadius: 3
              }
            }} 
          />
        </Box>
        
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Progress: 13/20 target connections
        </Typography>
        
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
          <Box 
            sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              bgcolor: '#4CAF50' 
            }} 
          />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            3 meetings this week
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 