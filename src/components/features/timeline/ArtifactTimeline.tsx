'use client';

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useArtifactTimeline } from '@/lib/hooks/useArtifactTimeline';
import { EnhancedTimelineItem } from './EnhancedTimelineItem';
import { EnhancedTimelineFilters } from './EnhancedTimelineFilters';
import { EnhancedTimelineStats } from './EnhancedTimelineStats';
import { ArtifactModal } from './ArtifactModal';
import { TimelineSkeleton } from './TimelineSkeleton';
import type { ArtifactGlobal, ArtifactType, GroupedArtifact } from '@/types';

interface ArtifactTimelineProps {
  contactId: string;
}

// Define the sx prop for the timeline container as per the plan
const timelineContainerSx = {
  position: 'relative',
  pt: 4,
  '&::before': {
    content: '""',
    position: 'absolute',
    left: { xs: '30px', md: '50%' }, // Left aligned on mobile
    top: 0,
    bottom: 0,
    width: '3px',
    background: 'linear-gradient(to bottom, #e3f2fd 0%, #2196f3 50%, #e3f2fd 100%)',
    transform: { xs: 'none', md: 'translateX(-50%)' },
    zIndex: 1
  }
};

export const ArtifactTimeline: React.FC<ArtifactTimelineProps> = ({ contactId }) => {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactGlobal | null>(null);
  const [filterTypes, setFilterTypes] = useState<ArtifactType[]>([]);
  
  const { 
    data: timelineData,
    isLoading, 
    error,
  } = useArtifactTimeline(contactId, { filterTypes });

  const groupedArtifacts = timelineData?.groupedArtifacts;
  const stats = timelineData?.stats;
  const allFetchedArtifacts = timelineData?.allArtifacts;

  if (isLoading) {
    return <TimelineSkeleton />;
  }
  
  if (error) {
    return <Alert severity="error" sx={{m:2}}>{error.message || "Failed to load timeline."}</Alert>;
  }

  if (!allFetchedArtifacts || allFetchedArtifacts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}>
        <Typography sx={{ fontSize: '3rem', mb: 2 }}>📭</Typography>
        <Typography variant="h6" gutterBottom>No artifacts recorded yet</Typography>
        <Typography>
          Record a voice memo or add a note to start building this contact's timeline.
        </Typography>
      </Box>
    );
  }
  
  if (!groupedArtifacts || groupedArtifacts.length === 0) {
    return (
      <Box sx={{ maxWidth: '900px', mx: 'auto', backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 120px)', p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, color: '#333', fontWeight: 'bold', textAlign:'center' }}>
          Artifact Timeline
        </Typography>
        {stats && <EnhancedTimelineStats stats={stats} />}
        <EnhancedTimelineFilters 
          filterTypes={filterTypes}
          onFilterChange={setFilterTypes}
        />
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary', mt:2 }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🧐</Typography>
          <Typography variant="h6" gutterBottom>No artifacts match your filters</Typography>
          <Typography>
            Try adjusting your filter selection or clearing all filters.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 120px)', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#333', fontWeight: 'bold', textAlign:'center' }}>
        Artifact Timeline
      </Typography>
      
      {stats && <EnhancedTimelineStats stats={stats} />}
      <EnhancedTimelineFilters 
        filterTypes={filterTypes}
        onFilterChange={setFilterTypes}
      />
      
      {/* Timeline Container */}
      <Box sx={timelineContainerSx}>
        {groupedArtifacts.map((group: GroupedArtifact) => (
          <Box key={group.date} sx={{mb: 2}}>
            <Typography 
              variant="h6" 
              sx={{ 
                textAlign: 'center', 
                mb: 3,
                backgroundColor: '#2196f3',
                color: 'white',
                py: 0.5,
                px: 2,
                borderRadius: '20px',
                display: 'inline-block',
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              {group.dateLabel}
            </Typography>
            
            {group.artifacts.map((artifact, index) => (
              <EnhancedTimelineItem
                key={artifact.id}
                artifact={artifact}
                position={index % 2 === 0 ? 'left' : 'right'}
                onClick={setSelectedArtifact}
              />
            ))}
          </Box>
        ))}
      </Box>

      <ArtifactModal
        artifact={selectedArtifact}
        open={!!selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
    </Box>
  );
}; 