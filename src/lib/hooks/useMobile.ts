'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';

/**
 * Hook to detect if the current viewport is mobile size
 * Uses MUI theme breakpoints for consistency
 */
export const useIsMobile = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

/**
 * Hook to detect if the current viewport is tablet size
 */
export const useIsTablet = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
};

/**
 * Hook to detect if the current viewport is desktop size
 */
export const useIsDesktop = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
};

/**
 * Hook to provide responsive sizing for touch-friendly interfaces
 */
export const useTouchFriendlySize = () => {
  const isMobile = useIsMobile();
  
  return useMemo(() => ({
    // Minimum touch target size (44px recommended)
    minTouchTarget: 44,
    
    // Button sizes based on device
    buttonSize: isMobile ? 'medium' : 'large',
    
    // Icon sizes
    iconSize: isMobile ? 'medium' : 'large',
    
    // Spacing scale for mobile-first design
    spacing: {
      xs: isMobile ? 1 : 2,
      sm: isMobile ? 2 : 3,
      md: isMobile ? 3 : 4,
      lg: isMobile ? 4 : 6,
    },
    
    // Typography variants that work well on mobile
    headerVariant: isMobile ? 'h5' : 'h4',
    subheaderVariant: isMobile ? 'h6' : 'h5',
    
    // Modal/Dialog sizing
    modalMaxWidth: isMobile ? '95vw' : 'sm',
    
    // Grid column sizing for responsive layouts
    gridMinWidth: isMobile ? '280px' : '200px',
  }), [isMobile]);
};

/**
 * Hook to provide responsive padding based on viewport
 */
export const useResponsivePadding = () => {
  const isMobile = useIsMobile();
  
  return useMemo(() => ({
    page: { xs: 2, md: 3 },
    section: { xs: 2, md: 4 },
    card: { xs: 2, md: 3 },
    modal: isMobile ? 2 : 3,
  }), [isMobile]);
};

/**
 * Hook to detect touch-capable devices
 */
export const useIsTouchDevice = (): boolean => {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);
};