'use client';

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface StageProgressProps {
  currentScreen: number;
  completedScreens: number[];
  onNavigateToStage?: (stageScreenNumber: number) => void;
  isNavigating?: boolean;
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

const isStageClickable = (stage: typeof STAGE_CONFIG[0], currentScreen: number, completedScreens: number[]) => {
  const status = getStageStatus(stage, currentScreen, completedScreens);
  // Stage is clickable if it's completed or partially completed (has some screens completed)
  return status === 'completed' || (status === 'active' && stage.screens.some(screen => completedScreens.includes(screen)));
};

export const StageProgress: React.FC<StageProgressProps> = ({ 
  currentScreen, 
  completedScreens,
  onNavigateToStage,
  isNavigating = false
}) => {
  const handleStageClick = (stage: typeof STAGE_CONFIG[0]) => {
    if (!onNavigateToStage || isNavigating) return;
    
    const clickable = isStageClickable(stage, currentScreen, completedScreens);
    if (!clickable) return;
    
    // Navigate to the first screen of the stage
    const firstScreen = stage.screens[0];
    onNavigateToStage(firstScreen);
  };

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
        const clickable = isStageClickable(stage, currentScreen, completedScreens);
        const isLast = index === STAGE_CONFIG.length - 1;
        
        const stageElement = (
          <Box 
            key={stage.id}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 1,
              cursor: clickable ? 'pointer' : 'default',
              opacity: isNavigating ? 0.6 : 1,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': clickable ? {
                transform: 'translateY(-2px)',
                transition: 'transform 0.2s ease-in-out'
              } : {}
            }}
            onClick={() => handleStageClick(stage)}
          >
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
                  color: 'white',
                  boxShadow: clickable ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none'
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
                  fontWeight: 500,
                  boxShadow: status === 'active' ? '0 4px 12px rgba(33, 150, 243, 0.3)' : 'none'
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
                fontWeight: clickable ? 500 : 400,
                color: clickable ? '#333' : '#666666',
                textAlign: 'center',
                minWidth: { xs: 60, sm: 70, md: 80 },
                mt: 0.5
              }}
            >
              {stage.label}
            </Typography>
          </Box>
        );
        
        return (
          <React.Fragment key={stage.id}>
            {/* Wrap in Tooltip if clickable */}
            {clickable ? (
              <Tooltip title={`Go to ${stage.label} section`} placement="top">
                {stageElement}
              </Tooltip>
            ) : (
              stageElement
            )}
            
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