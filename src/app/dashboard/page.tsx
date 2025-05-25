'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Transform your networking from overwhelming to systematic
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.title} sx={{ flex: '1 1 300px', minWidth: 250 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{ color: stat.color }}>
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Paper sx={{ p: 3, flex: '2 1 400px', minWidth: 300 }}>
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
        
        <Paper sx={{ p: 3, flex: '1 1 300px', minWidth: 250 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
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
            <Typography variant="body1" textAlign="center">
              Quick action buttons will appear here once contacts are added
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 