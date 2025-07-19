'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useGoalsForRelationshipBuilding } from '@/lib/hooks/useRelationshipSessions';
import { SessionStartModal } from '@/components/features/relationship-sessions';
import { useRouter } from 'next/navigation';
import { useTouchFriendlySize, useResponsivePadding } from '@/lib/hooks/useMobile';
import { responsive } from '@/lib/utils/mobileDesign';

export default function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [showStartModal, setShowStartModal] = useState(false);
  const router = useRouter();
  const touchFriendly = useTouchFriendlySize();
  const padding = useResponsivePadding();
  
  const { data: goals, isLoading: loadingGoals } = useGoalsForRelationshipBuilding();

  const getFirstName = () => {
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  };

  const firstName = getFirstName();

  const stats = [
    {
      title: 'Total Contacts',
      value: '0',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Recent Interactions',
      value: '0',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
    },
    {
      title: 'Active Loops',
      value: '0',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
    },
  ];

  const handleStartSession = () => {
    setShowStartModal(true);
  };

  const handleSessionCreated = (sessionId: string) => {
    setShowStartModal(false);
    // Navigate to top-level session route (bypasses dashboard layout)
    router.push(`/session/${sessionId}`);
  };

  return (
    <Box sx={{ p: padding.page }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant={touchFriendly.headerVariant as 'h4' | 'h5'} 
          component="h1" 
          sx={{ mb: responsive(2, 4) }} 
          gutterBottom
        >
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </Typography>
        
        {/* Enhanced Relationship Sessions Box */}
        <Paper sx={{ 
          p: responsive(3, 4), 
          flex: '1 1 300px', 
          minWidth: responsive(280, 250),
          borderRadius: responsive(2, 3),
          boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
          border: '1px solid rgba(33, 150, 243, 0.08)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
          }
        }}>
          <Typography 
            variant={touchFriendly.subheaderVariant as 'h5' | 'h6'} 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 1
            }}
          >
            Start Connection Session
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="body1"
              color="text.secondary" 
              sx={{ 
                mb: responsive(2, 3),
                lineHeight: 1.6,
                fontSize: responsive('0.875rem', '1rem')
              }}
            >
              Time-box sessions to make progress on your relationship building
            </Typography>
            
            {/* Enhanced Start Session Button */}
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSession}
              disabled={loadingGoals}
              fullWidth
              size={touchFriendly.buttonSize as 'medium' | 'large'}
              sx={{ 
                px: responsive(3, 6), 
                py: responsive(1.5, 2.5),
                fontSize: responsive('1rem', '1.2rem'),
                fontWeight: 600,
                borderRadius: responsive('25px', '50px'),
                background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 50%, #1976D2 100%)',
                boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)',
                textTransform: 'none',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                minHeight: touchFriendly.minTouchTarget,
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 50%, #21CBF3 100%)',
                  boxShadow: '0 12px 40px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  boxShadow: 'none',
                  transform: 'none'
                }
              }}
            >
              START SESSION
            </Button>
          </Box>
          
          {!loadingGoals && (!goals || goals.length === 0) && (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                color: 'text.secondary',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                mt: 2
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 32, mb: 1, opacity: 0.6 }} />
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                All caught up! No pending relationship actions.
              </Typography>
            </Box>
          )}
        </Paper>

      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${touchFriendly.gridMinWidth}, 1fr))`,
          gap: responsive(2, 3),
          mb: responsive(3, 4),
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent sx={{ textAlign: 'center', p: responsive(2, 3) }}>
              <Box sx={{ color: stat.color, mb: 2 }}>
                {stat.icon}
              </Box>
              <Typography 
                variant="h4"
                component="div" 
                sx={{ fontSize: responsive('1.5rem', '2.125rem') }}
                gutterBottom
              >
                {stat.value}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: responsive(2, 3),
          flexWrap: 'wrap',
        }}
      >
        <Paper sx={{ p: responsive(2, 3), flex: '2 1 400px', minWidth: responsive(280, 300) }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
              color: 'text.secondary',
            }}
          >
            <Typography variant="body1">
              No recent activity. Start by adding your first contact!
            </Typography>
          </Box>
        </Paper>
        

      </Box>
      
      {/* Session Start Modal */}
      <SessionStartModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        onSessionCreated={handleSessionCreated}
      />
    </Box>
  );
} 