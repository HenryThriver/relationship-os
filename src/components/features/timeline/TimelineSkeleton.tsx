'use client';

import React from 'react';
import { Box, Skeleton } from '@mui/material';

export const TimelineSkeleton: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', backgroundColor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      {/* Title Skeleton */}
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
      
      {/* Stats Skeleton */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 2, 
        mb: 3 
      }}>
        {[1,2,3,4].map(i => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '12px' }} />
        ))}
      </Box>
      
      {/* Filters Skeleton */}
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '12px', mb: 3 }} />
      
      {/* Timeline Items Skeleton */}
      <Box sx={{ 
        position: 'relative', 
        pt: 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: { xs: '30px', md: '50%' },
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(to bottom, #e3f2fd 0%, #2196f3 50%, #e3f2fd 100%)',
          transform: { xs: 'none', md: 'translateX(-50%)' },
          zIndex: 1
        }
      }}>
        {/* Date Label Skeleton */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Skeleton 
            variant="rectangular" 
            width={120} 
            height={32} 
            sx={{ 
              borderRadius: '20px', 
              display: 'inline-block',
              backgroundColor: '#e3f2fd'
            }} 
          />
        </Box>
        
        {[1,2,3].map(i => (
          <Box key={i} sx={{
            display: 'flex',
            justifyContent: { 
              xs: 'flex-start',
              md: i % 2 === 0 ? 'flex-end' : 'flex-start' 
            },
            mb: 4,
            position: 'relative'
          }}>
            {/* Timeline Dot Skeleton */}
            <Box sx={{
              position: 'absolute',
              left: { xs: '30px', md: '50%' },
              top: '20px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              border: '4px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transform: { xs: 'translateX(-50%)', md: 'translateX(-50%)' },
              zIndex: 10
            }} />
            
            {/* Connector Line Skeleton */}
            <Box sx={{
              position: 'absolute',
              left: { xs: '30px', md: '50%' },
              top: '30px',
              width: { xs: '22%', md: '22%' },
              height: '2px',
              backgroundColor: '#e3f2fd',
              transform: { 
                xs: 'translateX(10px)',
                md: i % 2 === 0 
                  ? 'translateX(-100%) translateX(-10px)' 
                  : 'translateX(10px)'
              },
              zIndex: 5
            }} />
            
            {/* Card Skeleton */}
            <Box sx={{ 
              width: { xs: 'calc(100% - 80px)', md: '44%' },
              ml: { xs: '80px', md: 0 }
            }}>
              <Skeleton 
                variant="rectangular" 
                width="100%"
                height={120} 
                sx={{ borderRadius: '12px' }} 
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}; 