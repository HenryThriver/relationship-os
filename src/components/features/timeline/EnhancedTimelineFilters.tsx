'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { 
  Mic as MicIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import type { ArtifactType } from '@/types';

const FILTER_OPTIONS = [
  { type: 'voice_memo' as ArtifactType, label: 'Voice Memos', icon: MicIcon, color: '#2196f3' },
  { type: 'note' as ArtifactType, label: 'Notes', icon: NoteIcon, color: '#ff9800' },
  { type: 'email' as ArtifactType, label: 'Emails', icon: EmailIcon, color: '#ea4335' },
  { type: 'meeting' as ArtifactType, label: 'Meetings', icon: EventIcon, color: '#4caf50' },
  { type: 'linkedin_profile' as ArtifactType, label: 'LinkedIn', icon: LinkedInIcon, color: '#0077b5' }
];

interface EnhancedTimelineFiltersProps {
  filterTypes: ArtifactType[];
  onFilterChange: (types: ArtifactType[]) => void;
}

export const EnhancedTimelineFilters: React.FC<EnhancedTimelineFiltersProps> = ({
  filterTypes,
  onFilterChange
}) => {
  const toggleFilter = (type: ArtifactType) => {
    if (filterTypes.includes(type)) {
      onFilterChange(filterTypes.filter(t => t !== type));
    } else {
      onFilterChange([...filterTypes, type]);
    }
  };

  return (
    <Box 
      sx={{
        mb: 3,
        p: 2,
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
      role="group"
      aria-labelledby="filter-group-label"
    >
      <Typography 
        id="filter-group-label"
        sx={{
          fontSize: '14px',
          color: '#495057',
          fontWeight: 600,
          mb: 1.5
        }}>
        Filter by type:
      </Typography>
      
      <Box sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {FILTER_OPTIONS.map(option => {
          const isActive = filterTypes.includes(option.type);
          const Icon = option.icon;
          
          return (
            <Chip
              key={option.type}
              icon={<Icon sx={{ fontSize: '16px' }} />}
              label={option.label}
              variant={isActive ? 'filled' : 'outlined'}
              onClick={() => toggleFilter(option.type)}
              aria-pressed={isActive}
              sx={{
                backgroundColor: isActive ? option.color : 'white',
                color: isActive ? 'white' : option.color,
                borderColor: option.color,
                fontWeight: 500,
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: isActive ? option.color : `${option.color}10`,
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            />
          );
        })}
        
        {filterTypes.length > 0 && (
          <Chip
            label="Clear All"
            variant="outlined"
            onClick={() => onFilterChange([])}
            aria-label="Clear all active filters"
            sx={{
              borderColor: '#6c757d',
              color: '#6c757d',
              fontSize: '13px',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f8f9fa'
              }
            }}
          />
        )}
      </Box>
    </Box>
  );
}; 