'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { NetworkFormationBackground } from './0_Welcome_Components/NetworkFormationBackground';
import { TypewriterText } from './0_Welcome_Components/TypewriterText';
import { PreviewCardsContainer } from './0_Welcome_Components/PreviewCardsContainer';
import { GoalCelebrationCard } from './0_Welcome_Components/cards/GoalCelebrationCard';
import { sleep } from './0_Welcome_Components/utils/animationSequence';

export const EnhancedWelcomeScreen: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { nextScreen, completeScreen, currentScreen } = useOnboardingState();
  
  const valuePropositionRef = useRef<HTMLDivElement>(null);
  const brandNameRef = useRef<HTMLDivElement>(null);
  
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [textPosition, setTextPosition] = useState<'center' | 'top'>('center');
  const [sequenceStarted, setSequenceStarted] = useState(false);
  const [showValueProp, setShowValueProp] = useState(false);
  const [showButton, setShowButton] = useState(false);
  
  useEffect(() => {
    if (sequenceStarted) return;
    
    const orchestrateFloatingSequence = async () => {
      setSequenceStarted(true);
      
      try {
        // 0-0.5s: Brief pause to establish the scene
        await sleep(500);
        
        // 0.5-2.5s: Brand name typewriter effect (centered)
        setShowTypewriter(true);
        
        // Wait for typewriter to complete + time to appreciate centered text
        await sleep(2500);
        
        // 3s: Float brand name upward and start network/cards
        setTextPosition('top'); // Triggers the float animation
        
        // Small delay to let float animation start before network
        await sleep(400);
        setShowNetwork(true);
        
        // Start cards after network begins
        await sleep(600);
        setShowCards(true);
        
        // Wait for cards to complete their overlapping cycle (6 cards: 5*1000ms + 2000ms = 7s total)
        // Extended celebration timing: give extra time for Goal Achieved card to be appreciated
        await sleep(8500); // Extra 1.7s for celebration focus - Goal Achieved card gets prominent display time
        
        // Hide cards and show tagline for emotional association
        setShowCards(false);
        await sleep(200); // Slightly longer transition for smoother handoff
        setShowValueProp(true);
        
        // Wait for tagline to settle, then show button
        await sleep(1800); // Give tagline time to fully fade in
        setShowButton(true);
        
      } catch (error) {
        console.error('Error in welcome sequence:', error);
        // Fallback: still show button to allow progression
        setShowButton(true);
      }
    };

    // Start sequence after brief delay
    const timeoutId = setTimeout(orchestrateFloatingSequence, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [sequenceStarted]);

  const handleBeginClick = async () => {
    try {
      await completeScreen(currentScreen);
      await nextScreen();
    } catch (error) {
      console.error('Error progressing to next screen:', error);
      // Fallback: direct navigation
      router.push('/onboarding');
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start',
        alignItems: 'center', 
        overflow: 'hidden',
        px: 3,
        py: 0,
        backgroundColor: '#ffffff',
        zIndex: 1000
      }}
    >
      {/* Background Network Animation */}
      {showNetwork && <NetworkFormationBackground />}
      
      {/* Main Content - Starts center, floats to top */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          zIndex: 2,
          position: 'absolute',
          top: textPosition === 'center' ? '50%' : '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: { xs: '90vw', sm: '80vw', md: '60vw', lg: '900px' },
          width: 'auto',
          transition: 'top 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* Brand Name with Typewriter Effect - Now appears first */}
        <Box ref={brandNameRef} sx={{ mb: textPosition === 'top' ? 6 : 3, transition: 'margin-bottom 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          {showTypewriter && (
            <TypewriterText
              text="Cultivate HQ"
              speed={150}
              delay={0}
              showCursor={false}
              variant={isMobile ? "h3" : "h2"}
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 50%, #1976D2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                lineHeight: 1.1,
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              }}
            />
          )}
        </Box>
      </Box>
      
      {/* Preview Cards - Visible during network animation */}
      <Box sx={{ 
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        bottom: 0,
        opacity: showCards ? 1 : 0,
        transition: 'opacity 1s ease-in-out'
      }}>
        {showCards && (
          <PreviewCardsContainer 
            startDelay={0}
            cardDisplayDuration={2000}
            cardStaggerDelay={1000}
          />
        )}
      </Box>
      
      {/* Goal Achieved Card - Positioned exactly like tagline for perfect alignment */}
      {showCards && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: '43%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            opacity: 0,
            animation: 'goal-celebration-sequence 8.5s ease-out forwards',
            '@keyframes goal-celebration-sequence': {
              '0%': { 
                opacity: 0,
                transform: 'translate(-50%, -50%) scale(0.95) translateY(10px)'
              },
              '59%': { // 5s out of 8.5s - card appears with other cards
                opacity: 0,
                transform: 'translate(-50%, -50%) scale(0.95) translateY(10px)'
              },
              '65%': { // Card fades in for celebration
                opacity: 0.9,
                transform: 'translate(-50%, -50%) scale(1) translateY(0)'
              },
              '95%': { // Hold celebration
                opacity: 0.9,
                transform: 'translate(-50%, -50%) scale(1) translateY(0)'
              },
              '100%': { // Fade out for tagline
                opacity: 0,
                transform: 'translate(-50%, -50%) scale(1) translateY(0)'
              }
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GoalCelebrationCard />
          </Box>
        </Box>
      )}
      
      {/* Value Proposition - Now appears at the end */}
      {showValueProp && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: '43%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 3,
            maxWidth: { xs: '90vw', sm: '80vw', md: '70vw', lg: '1000px' },
            opacity: 0,
            animation: showValueProp ? 'gentle-fade-in 1.5s ease-out forwards' : 'none',
            '@keyframes gentle-fade-in': {
              '0%': { 
                opacity: 0,
                transform: 'translate(-50%, -50%) translateY(20px)'
              },
              '100%': { 
                opacity: 1,
                transform: 'translate(-50%, -50%) translateY(0px)'
              }
            }
          }}
        >
          <Typography 
            ref={valuePropositionRef}
            variant={isMobile ? "h4" : "h3"} 
            sx={{ 
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#1a1a1a',
              lineHeight: 1.2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.25rem' },
              mb: 2
            }}
          >
            Where strategic minds cultivate extraordinary outcomes
          </Typography>
        </Box>
      )}
      
      {/* Begin Button - Appears after tagline */}
      {showButton && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: '65%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            opacity: 0,
            animation: showButton ? 'button-fade-in 1s ease-out 0.5s forwards' : 'none',
            '@keyframes button-fade-in': {
              '0%': { 
                opacity: 0,
                transform: 'translateX(-50%) translateY(10px)'
              },
              '100%': { 
                opacity: 1,
                transform: 'translateX(-50%) translateY(0px)'
              }
            }
          }}
        >
          <Button
            onClick={handleBeginClick}
            variant="contained"
            size="large"
            sx={{
              px: { xs: 4, sm: 6 },
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              fontWeight: 600,
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 50%, #1976D2 100%)',
              boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)',
              textTransform: 'none',
              letterSpacing: '0.5px',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 50%, #21CBF3 100%)',
                boxShadow: '0 12px 40px rgba(33, 150, 243, 0.4)',
                transform: 'scale(1.02)', // Confident, not eager
              }
            }}
          >
            Begin your transformation
          </Button>
        </Box>
      )}
      
      {/* Accessibility: Reduced motion support */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes draw-line {
          0% { 
            stroke-dashoffset: 50;
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% { 
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </Box>
  );
}; 