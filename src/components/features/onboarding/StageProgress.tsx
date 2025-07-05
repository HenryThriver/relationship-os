'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface StageProgressProps {
  currentScreen: number;
  completedScreens: number[];
}

// Stage configuration mapping screens to stages
const STAGE_CONFIG = [
  {
    id: 'challenges',
    label: 'Challenges',
    screens: [1, 2, 3, 4], // welcome, challenges, recognition, bridge
    number: 1
  },
  {
    id: 'goals', 
    label: 'Goals',
    screens: [5], // goals
    number: 2
  },
  {
    id: 'contacts',
    label: 'Contacts', 
    screens: [6, 7, 8], // contacts, contact_confirmation, context_discovery
    number: 3
  },
  {
    id: 'profile',
    label: 'Profile',
    screens: [9, 10, 11, 12], // linkedin, processing, profile, complete
    number: 4
  }
];

const getStageStatus = (stage: typeof STAGE_CONFIG[0], currentScreen: number, completedScreens: number[]) => {
  const isAnyScreenInStageCompleted = stage.screens.some(screen => completedScreens.includes(screen));
  const isCurrentStage = stage.screens.includes(currentScreen);
  const isAllScreensCompleted = stage.screens.every(screen => completedScreens.includes(screen));
  
  if (isAllScreensCompleted) return 'completed';
  if (isCurrentStage || isAnyScreenInStageCompleted) return 'active';
  return 'upcoming';
};

export const StageProgress: React.FC<StageProgressProps> = ({ 
  currentScreen, 
  completedScreens 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: { xs: 3, sm: 4, md: 5 },
      px: 1,
      py: 0.5
    }}>
      {STAGE_CONFIG.map((stage, index) => {
        const status = getStageStatus(stage, currentScreen, completedScreens);
        const isLast = index === STAGE_CONFIG.length - 1;
        
        return (
          <React.Fragment key={stage.id}>
            {/* Stage PIP */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 1
            }}>
              {/* PIP Circle */}
              <Box sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {status === 'completed' ? (
                  <Box sx={{
                    width: { xs: 24, sm: 26, md: 28 },
                    height: { xs: 24, sm: 26, md: 28 },
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <CheckCircle 
                      sx={{ 
                        fontSize: { xs: 16, sm: 18, md: 20 },
                        color: 'white'
                      }} 
                    />
                  </Box>
                ) : (
                  <Box sx={{
                    width: { xs: 24, sm: 26, md: 28 },
                    height: { xs: 24, sm: 26, md: 28 },
                    borderRadius: '50%',
                    backgroundColor: status === 'active' ? '#2196F3' : '#E0E0E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: status === 'active' ? 'white' : '#9E9E9E',
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                    fontWeight: 500
                  }}>
                    {stage.number}
                  </Box>
                )}
              </Box>
              
              {/* Stage Label */}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  fontWeight: 400,
                  color: '#666666',
                  textAlign: 'center',
                  minWidth: { xs: 60, sm: 70, md: 80 },
                  mt: 0.5
                }}
              >
                {stage.label}
              </Typography>
            </Box>
            
            {/* Connection Line */}
            {!isLast && (
              <Box sx={{
                width: { xs: 30, sm: 40, md: 50 },
                height: 2,
                backgroundColor: status === 'completed' ? '#4CAF50' : '#E0E0E0',
                borderRadius: 0,
                mt: -2 // Align with PIP center
              }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}; 