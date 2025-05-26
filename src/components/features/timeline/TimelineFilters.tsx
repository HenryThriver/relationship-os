'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import type { ArtifactType } from '@/types';
import { ALL_ARTIFACT_TYPES } from '@/config/artifactConfig'; // Import from config

// Dummy artifact types for now - will get from a central config or dynamically
// const ARTIFACT_TYPES: ArtifactType[] = ['note', 'voice_memo', 'meeting', 'email']; // Remove this line

interface TimelineFiltersProps {
  filterTypes: ArtifactType[];
  onFilterChange: (types: ArtifactType[]) => void;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({ filterTypes, onFilterChange }) => {
  const handleToggleFilter = (type: ArtifactType) => {
    const newFilterTypes = filterTypes.includes(type)
      ? filterTypes.filter(t => t !== type)
      : [...filterTypes, type];
    onFilterChange(newFilterTypes);
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ mr: 1, fontWeight: 'medium' }}>Filter by type:</Typography>
      {ALL_ARTIFACT_TYPES.map(type => ( // Use ALL_ARTIFACT_TYPES from config
        <Chip
          key={type}
          label={type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} // Basic formatting
          clickable
          onClick={() => handleToggleFilter(type)}
          color={filterTypes.includes(type) ? 'primary' : 'default'}
          variant={filterTypes.includes(type) ? 'filled' : 'outlined'}
          size="small"
        />
      ))}
    </Box>
  );
}; 