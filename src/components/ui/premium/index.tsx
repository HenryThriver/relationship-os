import React from 'react';
import { Card, CardProps, Box, BoxProps, Typography, Button, ButtonProps, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Premium Card with golden ratio spacing
export const PremiumCard = styled(Card)<CardProps & { accent?: 'sage' | 'plum' | 'amber' }>(
  ({ theme, accent }) => ({
    padding: 'var(--spacing-golden-mobile)',
    borderRadius: 12,
    border: `1px solid ${accent ? theme.palette[accent].light : theme.palette.grey[300]}`,
    borderLeftWidth: accent ? 3 : 1,
    borderLeftColor: accent ? theme.palette[accent].main : undefined,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 300ms var(--ease-confident)',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3C/defs%3E%3Crect width="100" height="100" filter="url(%23noise)" opacity="0.01"/%3E%3C/svg%3E")',
      pointerEvents: 'none',
    },
    
    '@media (min-width: 768px)': {
      padding: 'var(--spacing-golden)',
    },
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
  })
);

// Insight Card for pattern-breaking content
export const InsightCard = styled(PremiumCard)(({ theme }) => ({
  borderLeft: `3px solid ${theme.palette.sage.main}`,
  backgroundColor: '#FAFBFF',
  
  '& .insight-icon': {
    color: theme.palette.sage.main,
    marginBottom: theme.spacing(2),
  },
}));

// Executive Button with confident hover
export const ExecutiveButton = styled(Button)<ButtonProps>(({ theme }) => ({
  minHeight: 52,
  padding: '14px 32px',
  fontSize: '1.0625rem',
  fontWeight: 500,
  borderRadius: 8,
  letterSpacing: '0.02em',
  transition: 'all 200ms var(--ease-confident)',
  
  '&:hover': {
    transform: 'scale(1.02)',
  },
  
  '&.MuiButton-contained': {
    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
    
    '&:hover': {
      background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
    },
  },
}));

// Loading State Components
export const ExecutiveSkeleton = styled(Skeleton)(({ theme }) => ({
  '&::after': {
    background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.05), transparent)',
  },
  
  '&.pulse-sophisticated': {
    animation: 'sophisticated-pulse 2s ease-in-out infinite',
  },
  
  '@keyframes sophisticated-pulse': {
    '0%': { opacity: 0.7 },
    '50%': { opacity: 0.9 },
    '100%': { opacity: 0.7 },
  },
}));

// Progressive Reveal Container
export const ProgressiveReveal = styled(Box)<BoxProps & { delay?: number }>(
  ({ delay = 0 }) => ({
    opacity: 0,
    animation: `confident-entrance 800ms var(--ease-entrance) ${delay}ms forwards`,
    
    '@keyframes confident-entrance': {
      from: {
        opacity: 0,
        transform: 'translateY(20px)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
  })
);

// Pattern Breaking Text
export const PatternBreakingText = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  lineHeight: 1.25,
  fontWeight: 500,
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  position: 'relative',
  
  '&::before': {
    content: '"""',
    position: 'absolute',
    left: '-1.5rem',
    top: '-0.5rem',
    fontSize: '3rem',
    color: theme.palette.sage.light,
    fontFamily: 'Georgia, serif',
  },
})); 