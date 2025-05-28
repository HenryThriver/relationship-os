'use client';

import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { differenceInDays } from 'date-fns';
import { ArtifactType } from '@/types';

// Export this interface
export interface TimelineStatsData {
  totalArtifacts: number;
  firstArtifactDate: string | null;
  lastArtifactDate: string | null;
  artifactTypeCounts: Record<ArtifactType, number>;
  averageTimeBetweenDays: number;
  // Consider adding more, e.g. most common type, specific loop stats, etc.
}

// Interface for the props expects TimelineStatsData from our types
interface EnhancedTimelineStatsProps {
  stats: TimelineStatsData | null; // Allow null if stats might not be ready
}

export const EnhancedTimelineStats: React.FC<EnhancedTimelineStatsProps> = ({ stats }) => {
  if (!stats || stats.totalArtifacts === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3, textAlign: 'center', backgroundColor: 'grey.100' }}>
        <Typography variant="body2" color="text.secondary">
          No artifact data to display statistics.
        </Typography>
      </Paper>
    );
  }

  const { 
    totalArtifacts,
    firstArtifactDate,
    lastArtifactDate,
    artifactTypeCounts,
    averageTimeBetweenDays 
  } = stats;

  const engagementDuration = firstArtifactDate && lastArtifactDate 
    ? differenceInDays(new Date(lastArtifactDate), new Date(firstArtifactDate))
    : 0;

  return (
    <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2, overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: 'primary.main'}}>
        Timeline Snapshot
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box textAlign="center" p={1} bgcolor="primary.light" borderRadius={1}>
            <Typography variant="h4" fontWeight="bold" color="primary.contrastText">{totalArtifacts}</Typography>
            <Typography variant="caption" color="primary.contrastText">Total Artifacts</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box textAlign="center" p={1} bgcolor="secondary.light" borderRadius={1}>
            <Typography variant="h4" fontWeight="bold" color="secondary.contrastText">
              {engagementDuration}
            </Typography>
            <Typography variant="caption" color="secondary.contrastText">Engagement (Days)</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box textAlign="center" p={1} bgcolor="success.light" borderRadius={1}>
            <Typography variant="h4" fontWeight="bold" color="success.contrastText">
              {averageTimeBetweenDays > 0 ? averageTimeBetweenDays.toFixed(1) : 'N/A'}
            </Typography>
            <Typography variant="caption" color="success.contrastText">Avg. Days Between</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box textAlign="center" p={1} bgcolor="info.light" borderRadius={1} sx={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
             <Typography variant="subtitle2" fontWeight="bold" color="info.contrastText" gutterBottom>
                Types
             </Typography>
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={0.5}>
              {Object.entries(artifactTypeCounts).slice(0,3).map(([type, count]) => (
                <Chip key={type} label={`${type}: ${count}`} size="small" sx={{bgcolor: 'background.paper'}} />
              ))}
              {Object.keys(artifactTypeCounts).length > 3 && <Chip label="..." size="small" sx={{bgcolor: 'background.paper'}}/>}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}; 