'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { TimelineStatsData } from '@/types'; // Import the correct type

// Interface for the props expects TimelineStatsData from our types
interface EnhancedTimelineStatsProps {
  stats: TimelineStatsData | null; // Allow null if stats might not be ready
}

export const EnhancedTimelineStats: React.FC<EnhancedTimelineStatsProps> = ({ stats }) => {
  // Handle null stats gracefully
  if (!stats) {
    // Optionally render a loading state or nothing
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
        {[...Array(4)].map((_, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2.5, textAlign: 'center', borderRadius: '12px', opacity: 0.5 }}>
            <Typography sx={{ fontSize: '28px', fontWeight: 'bold', color: 'grey.400', mb: 0.5 }}>...</Typography>
            <Typography sx={{ fontSize: '12px', color: 'grey.600' }}>Loading...</Typography>
          </Paper>
        ))}
      </Box>
    );
  }

  // Determine most active type from stats.artifactTypeCounts
  let mostActiveTypeLabel = 'N/A';
  if (stats.artifactTypeCounts && Object.keys(stats.artifactTypeCounts).length > 0) {
    mostActiveTypeLabel = Object.entries(stats.artifactTypeCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    // Simple formatting for the label
    mostActiveTypeLabel = mostActiveTypeLabel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } else {
    mostActiveTypeLabel = 'None';
  }

  const statItems = [
    {
      value: stats.totalArtifacts,
      label: 'Total Artifacts',
      color: '#2196f3'
    },
    {
      // Example: If your TimelineStatsData had a "thisMonth" count, you'd use stats.thisMonth
      // For now, let's use a placeholder or a different stat like average days
      value: stats.averageTimeBetweenDays > 0 ? `${stats.averageTimeBetweenDays.toFixed(1)}d` : 'N/A',
      label: 'Avg. Cadence',
      color: '#28a745'
    },
    {
      // Placeholder for "Per Week Avg" - this would need calculation in useArtifactTimeline if desired
      value: 'N/A', 
      label: 'Per Week Avg',
      color: '#ffc107'
    },
    {
      value: mostActiveTypeLabel,
      label: 'Most Active',
      color: '#6f42c1',
      isText: true
    }
  ];

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 2,
      mb: 3
    }}>
      {statItems.map((item, index) => (
        <Paper
          key={index}
          elevation={1}
          sx={{
            p: 2.5,
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            backgroundColor: 'white',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Typography sx={{
            fontSize: item.isText ? '16px' : '28px',
            fontWeight: 'bold',
            color: item.color,
            mb: 0.5
          }}>
            {item.value}
          </Typography>
          <Typography sx={{
            fontSize: '12px',
            color: '#6c757d',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            {item.label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}; 