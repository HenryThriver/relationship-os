import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

const ExecutiveLoadingMessages = {
  linkedinAnalysis: [
    "Extracting strategic insights from professional background...",
    "Identifying potential collaboration opportunities...",
    "Mapping influence networks and key relationships...",
    "Discovering hidden connection pathways...",
  ],
  relationshipIntelligence: [
    "Analyzing conversation patterns for deeper connection...",
    "Identifying shared values and strategic interests...",
    "Calculating optimal outreach timing and approach...",
    "Architecting serendipity opportunities...",
  ],
  networkMapping: [
    "Discovering non-obvious connection pathways...",
    "Calculating network leverage opportunities...",
    "Identifying strategic introduction possibilities...",
    "Mapping competitive intelligence insights...",
  ],
  general: [
    "Analyzing strategic positioning...",
    "Mapping competitive intelligence...",
    "Identifying board-level opportunities...",
    "Calculating network leverage...",
  ],
};

const LoadingContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const SophisticatedProgress = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.grey[200],
  
  '& .MuiLinearProgress-bar': {
    borderRadius: 3,
    background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
  },
}));

interface ExecutiveLoadingProps {
  type?: keyof typeof ExecutiveLoadingMessages;
  duration?: number;
}

export const ExecutiveLoading: React.FC<ExecutiveLoadingProps> = ({ 
  type = 'general',
  duration = 3000,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = ExecutiveLoadingMessages[type];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, duration);
    
    return () => clearInterval(interval);
  }, [messages.length, duration]);
  
  return (
    <LoadingContainer>
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3,
          color: 'text.secondary',
          minHeight: '2em',
          transition: 'opacity 300ms ease-in-out',
        }}
      >
        {messages[messageIndex]}
      </Typography>
      <SophisticatedProgress />
    </LoadingContainer>
  );
};

// Executive Skeleton for Contact Cards
export const ContactCardSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
      <Skeleton 
        variant="circular" 
        width={64} 
        height={64}
        sx={{ flexShrink: 0 }}
        className="pulse-sophisticated"
      />
      <Box sx={{ flex: 1 }}>
        <Skeleton 
          width="60%" 
          height={32}
          sx={{ mb: 1 }}
          className="pulse-sophisticated"
          style={{ animationDelay: '100ms' }}
        />
        <Skeleton 
          width="80%" 
          height={24}
          sx={{ mb: 2 }}
          className="pulse-sophisticated"
          style={{ animationDelay: '200ms' }}
        />
        <Skeleton 
          width="40%" 
          height={20}
          className="pulse-sophisticated sage-hint"
          style={{ animationDelay: '300ms' }}
        />
      </Box>
    </Box>
    <Box sx={{ mt: 3 }}>
      <Skeleton 
        width="90%" 
        height={24}
        className="pulse-sophisticated"
        style={{ animationDelay: '400ms' }}
      />
    </Box>
  </Box>
); 