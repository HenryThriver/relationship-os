import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockHooks } from './test-utils';
import { EnhancedWelcomeScreen } from '../0_Welcome';

// Mock the hooks
const mockUseOnboardingState = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: mockUseOnboardingState,
}));

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
}));

describe('EnhancedWelcomeScreen', () => {
  const mockNextScreen = vi.fn();
  const mockCompleteScreen = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockUseOnboardingState.mockReturnValue({
      ...mockHooks.useOnboardingState(),
      nextScreen: mockNextScreen,
      completeScreen: mockCompleteScreen,
      currentScreen: 'welcome',
    });

    mockUseRouter.mockReturnValue({
      ...mockHooks.useRouter(),
      push: mockPush,
    });
  });

  describe('Brand Voice Compliance', () => {
    it('displays the Cultivate HQ brand name', async () => {
      render(<EnhancedWelcomeScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Cultivate HQ')).toBeInTheDocument();
      });
    });

    it('shows the strategic tagline', async () => {
      render(<EnhancedWelcomeScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Where strategic minds cultivate extraordinary outcomes')).toBeInTheDocument();
      });
    });

    it('displays executive-appropriate CTA button text', async () => {
      render(<EnhancedWelcomeScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Begin your transformation')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Sequence', () => {
    it('follows the proper animation timing sequence', async () => {
      render(<EnhancedWelcomeScreen />);
      
      // Initially, only the brand name should appear
      await waitFor(() => {
        expect(screen.getByText('Cultivate HQ')).toBeInTheDocument();
      });
      
      // The tagline should appear after the animation sequence
      await waitFor(() => {
        expect(screen.getByText('Where strategic minds cultivate extraordinary outcomes')).toBeInTheDocument();
      }, { timeout: 4000 });
      
      // The button should appear last
      await waitFor(() => {
        expect(screen.getByText('Begin your transformation')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('shows network background animation', async () => {
      render(<EnhancedWelcomeScreen />);
      
      // The network background component should be rendered
      await waitFor(() => {
        // Check for the container that holds the network animation
        const containers = screen.getAllByRole('presentation');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Interactions', () => {
    it('handles begin button click correctly', async () => {
      const user = userEvent.setup();
      render(<EnhancedWelcomeScreen />);
      
      // Wait for button to appear
      const beginButton = await screen.findByText('Begin your transformation');
      expect(beginButton).toBeInTheDocument();
      
      // Click the button
      await user.click(beginButton);
      
      // Verify navigation functions are called
      expect(mockCompleteScreen).toHaveBeenCalledWith('welcome');
      expect(mockNextScreen).toHaveBeenCalled();
    });

    it('handles errors gracefully during navigation', async () => {
      const user = userEvent.setup();
      
      // Mock an error in completeScreen
      mockCompleteScreen.mockRejectedValueOnce(new Error('Test error'));
      
      render(<EnhancedWelcomeScreen />);
      
      const beginButton = await screen.findByText('Begin your transformation');
      await user.click(beginButton);
      
      // Should fall back to direct navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses proper typography scale', async () => {
      render(<EnhancedWelcomeScreen />);
      
      const brandName = await screen.findByText('Cultivate HQ');
      const tagline = await screen.findByText('Where strategic minds cultivate extraordinary outcomes');
      
      // Check that elements have proper styling
      expect(brandName).toHaveStyle({ fontWeight: '700' });
      expect(tagline).toHaveStyle({ fontWeight: '600' });
    });

    it('implements confident button interactions', async () => {
      render(<EnhancedWelcomeScreen />);
      
      const button = await screen.findByText('Begin your transformation');
      
      // Should have proper styling for confident interactions
      expect(button).toHaveStyle({
        borderRadius: '50px',
        textTransform: 'none',
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper semantic structure', async () => {
      render(<EnhancedWelcomeScreen />);
      
      // Should have proper heading hierarchy
      const brandName = await screen.findByText('Cultivate HQ');
      expect(brandName.tagName).toBe('H2'); // Based on variant="h2"
      
      const tagline = await screen.findByText('Where strategic minds cultivate extraordinary outcomes');
      expect(tagline.tagName).toBe('H3'); // Based on variant="h3"
    });

    it('supports reduced motion preferences', () => {
      // Test that animations respect prefers-reduced-motion
      render(<EnhancedWelcomeScreen />);
      
      // Check that the style tag includes reduced motion support
      const styleElement = document.querySelector('style');
      expect(styleElement?.textContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('has proper button accessibility', async () => {
      render(<EnhancedWelcomeScreen />);
      
      const button = await screen.findByRole('button', { name: 'Begin your transformation' });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('Performance Considerations', () => {
    it('handles component unmounting gracefully', () => {
      const { unmount } = render(<EnhancedWelcomeScreen />);
      
      // Should not throw errors when unmounted
      expect(() => unmount()).not.toThrow();
    });

    it('cleans up timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = render(<EnhancedWelcomeScreen />);
      
      unmount();
      
      // Should clean up any pending timeouts
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});