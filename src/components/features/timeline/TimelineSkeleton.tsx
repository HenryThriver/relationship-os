'use client';

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const TimelineSkeleton: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', p: 3, backgroundColor: '#f8f9fa' }}>
      {/* Stats Skeleton */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
        {[...Array(4)].map((_,i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '12px' }} />
        ))}
      </Box>
      
      {/* Filters Skeleton */}
      <Skeleton variant="rectangular" height={70} sx={{ borderRadius: '12px', mb: 3, p:2 }} /> {/* Adjusted height & padding */}
      
      {/* Timeline Items Skeleton */}
      <Box sx={{ position: 'relative', pt: 4 }}>
        {/* Central Line Skeleton - can be omitted if ::before pseudo-element shows on skeleton's parent */}
        {/* For explicitness, can add a faint line here if desired, or ensure parent Box has ::before */}
        
        {[...Array(3)].map((_,i) => (
          <Box key={i} sx={{
            display: 'flex',
            justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end', // Match alternating for visual consistency
            mb: 4,
            width: '100%' // Ensure the parent Box takes full width for items to position against
          }}>
            <Skeleton 
              variant="rectangular" 
              width="44%" 
              height={150} // Increased height to better match EnhancedTimelineItem
              sx={{ borderRadius: '12px' }} 
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}; 