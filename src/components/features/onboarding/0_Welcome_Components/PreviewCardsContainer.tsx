'use client';

import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { ContactProfileCard } from './cards/ContactProfileCard';
import { ActionItemCard } from './cards/ActionItemCard';
import { GoalProgressCard } from './cards/GoalProgressCard';
import { VoiceMemoCard } from './cards/VoiceMemoCard';
import { TimelineCard } from './cards/TimelineCard';
import { PreviewCard, getResponsiveCardPositions } from './utils/cardPositioning';

interface PreviewCardsContainerProps {
  startDelay?: number;
  cardDisplayDuration?: number;
  cardStaggerDelay?: number;
}

export const PreviewCardsContainer: React.FC<PreviewCardsContainerProps> = ({
  startDelay = 2000,
  cardDisplayDuration = 2000,
  cardStaggerDelay = 800,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [visibleCards, setVisibleCards] = useState<PreviewCard[]>([]);

  const cardComponents = {
    contact: ContactProfileCard,
    action: ActionItemCard,
    goal: GoalProgressCard,
    voice: VoiceMemoCard,
    timeline: TimelineCard,
  };

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    const screenSize = isSmall ? 'sm' : isMobile ? 'md' : 'lg';
    const positions = getResponsiveCardPositions(screenSize);
    const cardTypes: Array<keyof typeof cardComponents> = ['contact', 'action', 'goal', 'voice', 'timeline'];
    
    // Show first 5 cards - celebration card now handled separately in main component  
    const cardSequence = cardTypes; // All 5 cards
    
    const showCardSequence = () => {
      const overlapDelay = 1000; // Start next card halfway through previous card's duration
      
      cardSequence.forEach((cardType, index) => {
        const position = positions[index % positions.length];
        const cardId = Date.now() + index;
        const startTime = startDelay + (index * overlapDelay);
        
        // Show card (add to existing visible cards for overlap)
        const showTimeout = setTimeout(() => {
          setVisibleCards(prev => [...prev, { 
            type: cardType, 
            position, 
            id: cardId 
          }]);
        }, startTime);
        timeouts.push(showTimeout);
        
        // Hide card after its full display duration
        const hideTimeout = setTimeout(() => {
          setVisibleCards(prev => prev.filter(card => card.id !== cardId));
        }, startTime + cardDisplayDuration);
        timeouts.push(hideTimeout);
      });
    };
    
    showCardSequence();
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [startDelay, cardDisplayDuration, cardStaggerDelay, isMobile, isSmall]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {visibleCards.map((card) => {
        const CardComponent = cardComponents[card.type];
        
        return (
          <Box
            key={card.id}
            sx={{
              position: 'absolute',
              ...card.position,
              opacity: 0,
              transform: 'scale(0.95) translateY(10px)',
              animation: 'preview-card-enter 0.8s ease-out forwards',
              '@keyframes preview-card-enter': {
                '0%': {
                  opacity: 0,
                  transform: 'scale(0.95) translateY(10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'scale(1) translateY(0)',
                },
              },
              // Responsive adjustments
              ...(isMobile && {
                transform: 'scale(0.85)',
                transformOrigin: 'center',
              }),
              ...(isSmall && {
                transform: 'scale(0.75)',
                transformOrigin: 'center',
              }),
            }}
          >
            <CardComponent />
          </Box>
        );
      })}
    </Box>
  );
}; 