'use client';

import React from 'react';
import { Paper, Grid, Typography } from '@mui/material';
import type { TimelineStatsData } from '@/types'; // Ensure this path is correct

interface TimelineStatsProps {
  stats: TimelineStatsData;
}

export const TimelineStats: React.FC<TimelineStatsProps> = ({ stats }) => {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'neutral.100' /* Using a light neutral bg */ }}>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Typography variant="h6" align="center">{stats.totalArtifacts}</Typography>
          <Typography variant="caption" align="center" display="block">Total Artifacts</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h6" align="center">{stats.firstArtifactDate || '-'}</Typography>
          <Typography variant="caption" align="center" display="block">First Interaction</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h6" align="center">{stats.lastArtifactDate || '-'}</Typography>
          <Typography variant="caption" align="center" display="block">Last Interaction</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h6" align="center">{stats.averageTimeBetweenDays > 0 ? `${stats.averageTimeBetweenDays.toFixed(1)}d` : '-'}</Typography>
          <Typography variant="caption" align="center" display="block">Avg. Cadence</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};
