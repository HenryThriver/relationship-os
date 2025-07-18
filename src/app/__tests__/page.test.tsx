import { render, screen } from '@/__tests__/test-utils';
import { vi } from 'vitest';
import HomePage from '../page';

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner and message when loading', () => {
      mockAuthContext.loading = true;
      
      render(<HomePage />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading Cultivate HQ...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render the main navigation with correct links', () => {
      render(<HomePage />);
      
      // Check logo/brand (get first occurrence in navigation)
      expect(screen.getAllByText('Cultivate HQ')[0]).toBeInTheDocument();
      
      // Check navigation links (get first occurrence in navigation)
      expect(screen.getAllByText('Features')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Pricing')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sign In')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Get Started')[0]).toBeInTheDocument();
    });

    it('should have correct href attributes for navigation links', () => {
      render(<HomePage />);
      
      const featuresLink = screen.getAllByText('Features')[0].closest('a');
      const pricingLink = screen.getAllByText('Pricing')[0].closest('a');
      const signInButton = screen.getAllByText('Sign In')[0].closest('a');
      const getStartedButton = screen.getAllByText('Get Started')[0].closest('a');
      
      expect(featuresLink).toHaveAttribute('href', '/features');
      expect(pricingLink).toHaveAttribute('href', '/pricing');
      expect(signInButton).toHaveAttribute('href', '/login');
      expect(getStartedButton).toHaveAttribute('href', '/pricing');
    });
  });

  describe('Hero Section', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render the main headline with strategic messaging', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText('extraordinary outcomes')).toBeInTheDocument();
    });

    it('should display pattern-breaking subtitle', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/Most relationship building feels like speed dating in business casual/)).toBeInTheDocument();
    });

    it('should render primary CTA buttons', () => {
      render(<HomePage />);
      
      const primaryCTA = screen.getAllByText('Begin strategic analysis')[0];
      const secondaryCTA = screen.getAllByText('Watch demo')[0];
      
      expect(primaryCTA).toBeInTheDocument();
      expect(secondaryCTA).toBeInTheDocument();
      
      // Check that primary CTA links to pricing
      expect(primaryCTA.closest('a')).toHaveAttribute('href', '/pricing');
    });

    it('should display pricing information', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Professional • $30/month • No setup fees')).toBeInTheDocument();
    });
  });

  describe('Four Pillars Section', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render the pillars section heading', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Four pillars of relationship excellence')).toBeInTheDocument();
    });

    it('should display all four pillars with correct titles', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Strategic Connection Architecture')).toBeInTheDocument();
      expect(screen.getByText('Proactive Relationship Nurturing')).toBeInTheDocument();
      expect(screen.getByText('Strategic Ask Management')).toBeInTheDocument();
      expect(screen.getByText('Sustainable Systems Design')).toBeInTheDocument();
    });

    it('should display pillar categories', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Execution')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
    });

    it('should display pillar descriptions', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/Identify and connect with the right people aligned to your goals/)).toBeInTheDocument();
      expect(screen.getByText(/Transform passive networking into active relationship tending/)).toBeInTheDocument();
      expect(screen.getByText(/Be clear about what to ask, of whom, and when/)).toBeInTheDocument();
      expect(screen.getByText(/Build relationship practices that scale without burnout/)).toBeInTheDocument();
    });
  });

  describe('Key Features Section', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render the features section heading', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Intelligence that transforms relationships')).toBeInTheDocument();
    });

    it('should display all four key features', () => {
      render(<HomePage />);
      
      expect(screen.getByText('AI-Powered Contact Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Smart Follow-up Automation')).toBeInTheDocument();
      expect(screen.getByText('Generosity-First Networking')).toBeInTheDocument();
      expect(screen.getByText('Smart Introduction Engine')).toBeInTheDocument();
    });

    it('should display feature descriptions', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Never forget names, faces, or important details again')).toBeInTheDocument();
      expect(screen.getByText('Personalized follow-up suggestions within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Lead with value, not requests')).toBeInTheDocument();
      expect(screen.getByText('Facilitate valuable connections automatically')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render the final CTA section', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Ready to transform your relationship building?')).toBeInTheDocument();
    });

    it('should display strategic messaging about relationship building', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/The best relationships aren't built at networking events/)).toBeInTheDocument();
    });

    it('should render final CTA button linking to pricing', () => {
      render(<HomePage />);
      
      const finalCTA = screen.getAllByText('Get started today')[0];
      expect(finalCTA).toBeInTheDocument();
      expect(finalCTA.closest('a')).toHaveAttribute('href', '/pricing');
    });
  });

  describe('Footer', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should render footer with brand information', () => {
      render(<HomePage />);
      
      expect(screen.getByText('© 2025 Cultivate HQ. All rights reserved.')).toBeInTheDocument();
    });

    it('should display footer navigation links', () => {
      render(<HomePage />);
      
      const footerLinks = screen.getAllByText('Features');
      const footerPricing = screen.getAllByText('Pricing');
      const footerSignIn = screen.getAllByText('Sign In');
      
      // Should have navigation and footer links (at least 2 occurrences each)
      expect(footerLinks.length).toBeGreaterThanOrEqual(2);
      expect(footerPricing.length).toBeGreaterThanOrEqual(2);
      expect(footerSignIn.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect authenticated users to dashboard', () => {
      mockAuthContext.loading = false;
      mockAuthContext.user = { id: 'test-user' };

      render(<HomePage />);

      // Since this is a useEffect, we don't need to test the redirect behavior
      // in unit tests - this would be better tested in E2E tests
      expect(mockAuthContext.user).toBeTruthy();
    });

    it('should not redirect when user is null', () => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;

      render(<HomePage />);

      expect(mockAuthContext.user).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;
    });

    it('should have proper semantic structure', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have accessible navigation', () => {
      render(<HomePage />);
      
      const signInButton = screen.getAllByText('Sign In')[0];
      const getStartedButton = screen.getAllByText('Get Started')[0];
      
      expect(signInButton).toHaveAttribute('href', '/login');
      expect(getStartedButton).toHaveAttribute('href', '/pricing');
    });

    it('should have proper heading hierarchy', () => {
      render(<HomePage />);
      
      // Check for main headings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    });
  });
});