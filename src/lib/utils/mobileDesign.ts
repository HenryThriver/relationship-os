/**
 * Mobile-first design system utilities
 * Provides consistent mobile design patterns across the app
 */

export const mobileDesign = {
  // Touch-friendly sizing
  touchTarget: {
    min: 44, // Minimum touch target size in pixels
    preferred: 48, // Preferred touch target size
  },
  
  // Responsive spacing scale
  spacing: {
    page: { xs: 2, md: 3 },
    section: { xs: 2, md: 4 },
    card: { xs: 2, md: 3 },
    list: { xs: 1, md: 2 },
    form: { xs: 2, md: 3 },
  },
  
  // Typography scaling for mobile
  typography: {
    pageTitle: { xs: 'h5', md: 'h4' },
    sectionTitle: { xs: 'h6', md: 'h5' },
    cardTitle: { xs: 'subtitle1', md: 'h6' },
    body: { xs: 'body2', md: 'body1' },
  },
  
  // Button sizing patterns
  buttons: {
    primary: { xs: 'medium', md: 'large' },
    secondary: { xs: 'small', md: 'medium' },
    icon: { xs: 'small', md: 'medium' },
  },
  
  // Grid and layout patterns
  grid: {
    cardMinWidth: { xs: '280px', md: '200px' },
    listMinWidth: { xs: '100%', md: 'auto' },
  },
  
  // Modal and dialog sizing
  modal: {
    maxWidth: { xs: '95vw', sm: 'sm', md: 'md' },
    fullScreen: { xs: true, sm: false },
  },
  
  // Common responsive breakpoints
  breakpoints: {
    mobile: { xs: 'block', md: 'none' },
    desktop: { xs: 'none', md: 'block' },
    mobileInline: { xs: 'inline', md: 'none' },
    desktopInline: { xs: 'none', md: 'inline' },
  },
} as const;

/**
 * Helper function to get responsive direction
 */
export const getResponsiveDirection = (mobile: 'row' | 'column' = 'column', desktop: 'row' | 'column' = 'row') => ({
  xs: mobile,
  md: desktop,
});

/**
 * Helper function to get responsive alignment
 */
export const getResponsiveAlignment = (
  mobile: 'flex-start' | 'center' | 'flex-end' | 'space-between' = 'center',
  desktop: 'flex-start' | 'center' | 'flex-end' | 'space-between' = 'space-between'
) => ({
  xs: mobile,
  md: desktop,
});

/**
 * Helper function to get responsive gap spacing
 */
export const getResponsiveGap = (mobile: number = 1, desktop: number = 2) => ({
  xs: mobile,
  md: desktop,
});

/**
 * Helper to create mobile-first responsive values
 */
export const responsive = <T>(mobile: T, desktop?: T) => ({
  xs: mobile,
  ...(desktop && { md: desktop }),
});