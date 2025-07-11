'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonUnchecked,
  PlayArrow,
  MoreVert,
  Lightbulb,
  EmojiEvents,
  Groups,
  Person
} from '@mui/icons-material';
import type { OnboardingScreen } from '@/types/userProfile';

interface ScreenNavigatorProps {
  currentScreen: number;
  completedScreens: number[];
  onNavigateToScreen?: (screenNumber: number) => void;
  isNavigating?: boolean;
  canNavigateToScreen?: (screenNumber: number) => boolean;
}

// Screen configuration with icons and descriptions
const SCREEN_CONFIG: Array<{
  number: number;
  id: OnboardingScreen;
  title: string;
  description: string;
  icon: React.ReactNode;
  stage: string;
  stageNumber: number;
}> = [
  {
    number: 1,
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to Connection OS',
    icon: <EmojiEvents />,
    stage: 'challenges',
    stageNumber: 1
  },
  {
    number: 2,
    id: 'challenges',
    title: 'Share Challenges',
    description: 'Tell us about your networking challenges',
    icon: <Lightbulb />,
    stage: 'challenges',
    stageNumber: 1
  },
  {
    number: 3,
    id: 'recognition',
    title: 'Challenge Recognition',
    description: 'See how we address common challenges',
    icon: <CheckCircle />,
    stage: 'challenges',
    stageNumber: 1
  },
  {
    number: 4,
    id: 'bridge',
    title: 'Bridge',
    description: 'Connect challenges to solutions',
    icon: <PlayArrow />,
    stage: 'challenges',
    stageNumber: 1
  },
  {
    number: 5,
    id: 'goals',
    title: 'Set Goals',
    description: 'Define your professional objectives',
    icon: <EmojiEvents />,
    stage: 'goals',
    stageNumber: 2
  },
  {
    number: 6,
    id: 'contacts',
    title: 'Import Contacts',
    description: 'Add your professional contacts',
    icon: <Groups />,
    stage: 'contacts',
    stageNumber: 3
  },
  {
    number: 7,
    id: 'contact_confirmation',
    title: 'Confirm Contacts',
    description: 'Review and confirm your contacts',
    icon: <CheckCircle />,
    stage: 'contacts',
    stageNumber: 3
  },
  {
    number: 8,
    id: 'context_discovery',
    title: 'Context Discovery',
    description: 'Connect additional data sources',
    icon: <Lightbulb />,
    stage: 'contacts',
    stageNumber: 3
  },
  {
    number: 9,
    id: 'linkedin',
    title: 'LinkedIn Import',
    description: 'Import your LinkedIn profile',
    icon: <Person />,
    stage: 'profile',
    stageNumber: 4
  },
  {
    number: 10,
    id: 'processing',
    title: 'Processing',
    description: 'AI processing your information',
    icon: <RadioButtonUnchecked />,
    stage: 'profile',
    stageNumber: 4
  },
  {
    number: 11,
    id: 'profile',
    title: 'Review Profile',
    description: 'Review your generated profile',
    icon: <Person />,
    stage: 'profile',
    stageNumber: 4
  },
  {
    number: 12,
    id: 'complete',
    title: 'Complete',
    description: 'Onboarding complete!',
    icon: <EmojiEvents />,
    stage: 'profile',
    stageNumber: 4
  }
];

const STAGE_NAMES: Record<string, string> = {
  challenges: 'Challenges',
  goals: 'Goals', 
  contacts: 'Contacts',
  profile: 'Profile'
};

export const ScreenNavigator: React.FC<ScreenNavigatorProps> = ({
  currentScreen,
  completedScreens,
  onNavigateToScreen,
  isNavigating = false,
  canNavigateToScreen
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (screenNumber: number) => {
    if (onNavigateToScreen && canNavigateToScreen && canNavigateToScreen(screenNumber)) {
      onNavigateToScreen(screenNumber);
      handleClose();
    }
  };

  const getScreenStatus = (screenNumber: number) => {
    if (completedScreens.includes(screenNumber)) return 'completed';
    if (screenNumber === currentScreen) return 'current';
    if (canNavigateToScreen && canNavigateToScreen(screenNumber)) return 'accessible';
    return 'locked';
  };

  const groupedScreens = SCREEN_CONFIG.reduce((acc, screen) => {
    if (!acc[screen.stage]) {
      acc[screen.stage] = [];
    }
    acc[screen.stage].push(screen);
    return acc;
  }, {} as Record<string, typeof SCREEN_CONFIG>);

  const currentScreenInfo = SCREEN_CONFIG.find(s => s.number === currentScreen);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Current Screen Indicator */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 2, 
        py: 0.5,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: 2,
        border: '1px solid rgba(33, 150, 243, 0.2)'
      }}>
        <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
          {currentScreenInfo?.icon}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
          {currentScreenInfo?.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          ({currentScreen}/12)
        </Typography>
      </Box>

      {/* Navigation Menu Button */}
      <Tooltip title="Navigate to other screens">
        <IconButton
          onClick={handleClick}
          disabled={isNavigating}
          size="small"
          sx={{ 
            ml: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>

      {/* Navigation Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPopover-paper': {
            maxWidth: 350,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Navigate to Screen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click on any accessible screen to jump to it
          </Typography>

          {Object.entries(groupedScreens).map(([stageKey, screens]) => (
            <Box key={stageKey} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'primary.main', 
                fontWeight: 600,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {STAGE_NAMES[stageKey]}
                <Chip 
                  label={screens[0].stageNumber} 
                  size="small" 
                  sx={{ minWidth: 24, height: 20 }}
                />
              </Typography>
              
              <List dense sx={{ py: 0 }}>
                {screens.map((screen) => {
                  const status = getScreenStatus(screen.number);
                  const clickable = status === 'completed' || status === 'accessible';
                  
                  return (
                    <ListItem key={screen.number} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(screen.number)}
                        disabled={!clickable || isNavigating}
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: clickable ? 'rgba(33, 150, 243, 0.04)' : 'transparent'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {status === 'completed' ? (
                            <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                          ) : status === 'current' ? (
                            <PlayArrow sx={{ fontSize: 20, color: 'primary.main' }} />
                          ) : (
                            <RadioButtonUnchecked sx={{ 
                              fontSize: 20, 
                              color: clickable ? 'action.active' : 'action.disabled' 
                            }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={screen.title}
                          secondary={screen.description}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: status === 'current' ? 600 : 400,
                            color: status === 'current' ? 'primary.main' : 'text.primary'
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            color: 'text.secondary'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
              
              {stageKey !== 'profile' && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}; 