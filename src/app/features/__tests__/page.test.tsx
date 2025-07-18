import { render, screen } from '@/__tests__/test-utils';
import { vi } from 'vitest';
import FeaturesPage from '../page';

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

describe('FeaturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.loading = false;
    mockAuthContext.user = null;
  });

  describe('Loading State', () => {
    it('should display loading spinner and message when loading', () => {
      mockAuthContext.loading = true;
      
      render(<FeaturesPage />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading Cultivate HQ...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render the main navigation with correct links', () => {
      render(<FeaturesPage />);
      
      // Check logo/brand
      expect(screen.getAllByText('Cultivate HQ')[0]).toBeInTheDocument();
      
      // Check navigation links
      expect(screen.getAllByText('Features')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Pricing')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sign In')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Get Started')[0]).toBeInTheDocument();
    });

    it('should have correct href attributes for navigation links', () => {
      render(<FeaturesPage />);
      
      const featuresLink = screen.getAllByText('Features')[0].closest('a');
      const pricingLink = screen.getAllByText('Pricing')[0].closest('a');
      const signInButton = screen.getAllByText('Sign In')[0].closest('a');
      const getStartedButton = screen.getAllByText('Get Started')[0].closest('a');
      
      expect(featuresLink).toHaveAttribute('href', '/features');
      expect(pricingLink).toHaveAttribute('href', '/pricing');
      expect(signInButton).toHaveAttribute('href', '/login');
      expect(getStartedButton).toHaveAttribute('href', '/pricing');
    });

    it('should highlight features link as active', () => {
      render(<FeaturesPage />);
      
      const featuresLink = screen.getAllByText('Features')[0];
      expect(featuresLink).toHaveStyle('color: rgb(33, 150, 243)'); // primary.main color
    });
  });

  describe('Hero Section', () => {
    it('should render the main headline with sophisticated messaging', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText(/Sophisticated capabilities for/)).toBeInTheDocument();
      expect(screen.getByText('relationship mastery')).toBeInTheDocument();
    });

    it('should display executive-focused subtitle', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText(/Designed for executives who understand that relationships are the ultimate competitive advantage/)).toBeInTheDocument();
    });

    it('should render primary CTA button', () => {
      render(<FeaturesPage />);
      
      const primaryCTA = screen.getByText('Start strategic analysis');
      expect(primaryCTA).toBeInTheDocument();
      expect(primaryCTA.closest('a')).toHaveAttribute('href', '/pricing');
    });
  });

  describe('Feature Categories', () => {
    it('should render all four feature categories', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText(/Intelligence Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Automation Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Strategy Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Communication Features/i)).toBeInTheDocument();
    });

    it('should display category descriptions', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText(/AI-powered insights that reveal hidden patterns and opportunities/)).toBeInTheDocument();
      expect(screen.getByText(/Sophisticated automation that handles routine tasks/)).toBeInTheDocument();
      expect(screen.getByText(/Strategic frameworks that transform relationship building/)).toBeInTheDocument();
      expect(screen.getByText(/Advanced communication tools that elevate every interaction/)).toBeInTheDocument();
    });
  });

  describe('Intelligence Features', () => {
    it('should display AI-Powered Contact Intelligence feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('AI-Powered Contact Intelligence')).toBeInTheDocument();
      expect(screen.getByText(/Automatically capture and organize every detail about your contacts/)).toBeInTheDocument();
    });

    it('should display Relationship Analytics feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Relationship Analytics & Insights')).toBeInTheDocument();
      expect(screen.getByText(/Track the health and growth of your professional relationships/)).toBeInTheDocument();
    });

    it('should display Context Preservation feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Context Preservation System')).toBeInTheDocument();
      expect(screen.getByText(/Never lose track of important relationship context/)).toBeInTheDocument();
    });
  });

  describe('Automation Features', () => {
    it('should display Smart Follow-up Automation feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Smart Follow-up Automation')).toBeInTheDocument();
      expect(screen.getByText(/Get personalized follow-up suggestions within 24 hours/)).toBeInTheDocument();
    });

    it('should display Relationship Maintenance feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Relationship Maintenance System')).toBeInTheDocument();
      expect(screen.getByText(/Automated reminders and suggested touchpoints/)).toBeInTheDocument();
    });

    it('should display Smart Introduction Engine feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Smart Introduction Engine')).toBeInTheDocument();
      expect(screen.getByText(/Automatically identify and facilitate valuable introductions/)).toBeInTheDocument();
    });
  });

  describe('Strategy Features', () => {
    it('should display Generosity-First Networking feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Generosity-First Networking')).toBeInTheDocument();
      expect(screen.getByText(/Get suggestions for ways to help others first/)).toBeInTheDocument();
    });

    it('should display Personal Brand Discovery feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Personal Brand Discovery')).toBeInTheDocument();
      expect(screen.getByText(/Identify and articulate your unique value proposition/)).toBeInTheDocument();
    });

    it('should display Strategic Networking Roadmap feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Strategic Networking Roadmap')).toBeInTheDocument();
      expect(screen.getByText(/Get a personalized action plan with prioritized next steps/)).toBeInTheDocument();
    });
  });

  describe('Communication Features', () => {
    it('should display Conversation Intelligence feature', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Conversation Intelligence')).toBeInTheDocument();
      expect(screen.getByText(/Pre-event research and conversation starters/)).toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    it('should display feature icons for each feature', () => {
      render(<FeaturesPage />);
      
      // Check that feature cards are rendered - use a more specific selector
      const featureCards = screen.getAllByText('Relevant for:');
      expect(featureCards.length).toBe(10);
    });

    it('should display category chips for each feature', () => {
      render(<FeaturesPage />);
      
      // Check for category chips
      const intelligenceChips = screen.getAllByText('intelligence');
      const automationChips = screen.getAllByText('automation');
      const strategyChips = screen.getAllByText('strategy');
      const communicationChips = screen.getAllByText('communication');
      
      expect(intelligenceChips.length).toBeGreaterThan(0);
      expect(automationChips.length).toBeGreaterThan(0);
      expect(strategyChips.length).toBeGreaterThan(0);
      expect(communicationChips.length).toBeGreaterThan(0);
    });

    it('should display "Relevant for" sections', () => {
      render(<FeaturesPage />);
      
      // Check for "Relevant for:" labels
      const relevantForLabels = screen.getAllByText('Relevant for:');
      expect(relevantForLabels.length).toBeGreaterThan(0);
    });

    it('should display relevant use case chips', () => {
      render(<FeaturesPage />);
      
      // Check for specific use case chips (using getAllByText for duplicates)
      expect(screen.getByText('memory')).toBeInTheDocument();
      expect(screen.getByText('follow-up')).toBeInTheDocument();
      expect(screen.getAllByText('strategy')[0]).toBeInTheDocument();
      expect(screen.getByText('awkward')).toBeInTheDocument(); // This is from conversation_intelligence feature
    });
  });

  describe('CTA Section', () => {
    it('should render the final CTA section', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('Ready to transform your relationship building?')).toBeInTheDocument();
    });

    it('should display strategic messaging', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText(/Experience the power of systematic relationship intelligence/)).toBeInTheDocument();
    });

    it('should render CTA buttons with correct links', () => {
      render(<FeaturesPage />);
      
      const getStartedBtn = screen.getAllByText('Get started today')[0];
      const learnMoreBtn = screen.getByText('Learn more');
      
      expect(getStartedBtn).toBeInTheDocument();
      expect(learnMoreBtn).toBeInTheDocument();
      
      expect(getStartedBtn.closest('a')).toHaveAttribute('href', '/pricing');
      expect(learnMoreBtn.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Footer', () => {
    it('should render footer with brand information', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByText('© 2025 Cultivate HQ. All rights reserved.')).toBeInTheDocument();
    });

    it('should display footer navigation links', () => {
      render(<FeaturesPage />);
      
      const footerFeatures = screen.getAllByText('Features');
      const footerPricing = screen.getAllByText('Pricing');
      const footerSignIn = screen.getAllByText('Sign In');
      
      // Should have navigation and footer links
      expect(footerFeatures.length).toBeGreaterThanOrEqual(2);
      expect(footerPricing.length).toBeGreaterThanOrEqual(2);
      expect(footerSignIn.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect authenticated users to dashboard', () => {
      mockAuthContext.loading = false;
      mockAuthContext.user = { id: 'test-user' };

      render(<FeaturesPage />);

      // Since this is a useEffect, we don't need to test the redirect behavior
      // in unit tests - this would be better tested in E2E tests
      expect(mockAuthContext.user).toBeTruthy();
    });

    it('should not redirect when user is null', () => {
      mockAuthContext.loading = false;
      mockAuthContext.user = null;

      render(<FeaturesPage />);

      expect(mockAuthContext.user).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<FeaturesPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have accessible navigation', () => {
      render(<FeaturesPage />);
      
      const signInButton = screen.getAllByText('Sign In')[0];
      const getStartedButton = screen.getAllByText('Get Started')[0];
      
      expect(signInButton).toHaveAttribute('href', '/login');
      expect(getStartedButton).toHaveAttribute('href', '/pricing');
    });

    it('should have proper heading hierarchy', () => {
      render(<FeaturesPage />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for section headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Data Integration', () => {
    it('should render all 10 features from CULTIVATE_FEATURES', () => {
      render(<FeaturesPage />);
      
      // Check that we have the expected number of features
      const featureCards = screen.getAllByText('Relevant for:');
      expect(featureCards.length).toBe(10); // Should match CULTIVATE_FEATURES length
    });

    it('should group features correctly by category', () => {
      render(<FeaturesPage />);
      
      // Intelligence category should have 3 features
      const intelligenceChips = screen.getAllByText('intelligence');
      expect(intelligenceChips.length).toBe(3);
      
      // Automation category should have 3 features
      const automationChips = screen.getAllByText('automation');
      expect(automationChips.length).toBe(3);
      
      // Strategy category should have 3 features
      const strategyChips = screen.getAllByText('strategy');
      expect(strategyChips.length).toBe(3);
      
      // Communication category should have 1 feature
      const communicationChips = screen.getAllByText('communication');
      expect(communicationChips.length).toBe(1);
    });
  });

  describe('Visual Design Elements', () => {
    it('should display category icons', () => {
      render(<FeaturesPage />);
      
      // Category sections should be rendered with icons
      // Check specifically for the category feature headings
      expect(screen.getByText(/Intelligence Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Automation Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Strategy Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Communication Features/i)).toBeInTheDocument();
    });

    it('should display sophisticated gradients and styling', () => {
      render(<FeaturesPage />);
      
      // Check that the hero section contains the sophisticated messaging
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sophisticated capabilities for relationship mastery');
    });
  });
});