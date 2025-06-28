'use client';

import React, { useState, useEffect } from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface TypewriterTextProps extends Omit<TypographyProps, 'children'> {
  text: string;
  speed?: number;
  delay?: number;
  showCursor?: boolean;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 100,
  delay = 0,
  showCursor = true,
  onComplete,
  ...typographyProps
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? delay : speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
      
      // Start cursor blinking after completion
      if (showCursor) {
        const blinkInterval = setInterval(() => {
          setShowCursorBlink(prev => !prev);
        }, 530);
        
        return () => clearInterval(blinkInterval);
      }
    }
  }, [currentIndex, text, speed, delay, onComplete, showCursor, isComplete]);

  return (
    <Typography 
      {...typographyProps}
      sx={{
        fontFamily: 'monospace',
        ...typographyProps.sx,
      }}
    >
      {displayText}
      {showCursor && (
        <span
          style={{
            opacity: showCursorBlink ? 1 : 0,
            transition: 'opacity 0.1s ease-in-out',
            color: '#2196F3',
            fontWeight: 'normal',
          }}
        >
          |
        </span>
      )}
    </Typography>
  );
}; 