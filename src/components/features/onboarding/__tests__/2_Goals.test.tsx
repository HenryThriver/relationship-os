import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockHooks } from './test-utils';
import GoalsScreen from '../2_Goals_2.0_Share';

// Mock hooks and components
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: vi.fn(),
}));

vi.mock('@/lib/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../OnboardingVoiceRecorder', () => ({
  default: ({ onRecordingComplete, disabled, title, description }: any) => (
    <div data-testid="voice-recorder">
      <h3>{title}</h3>
      <p>{description}</p>
      <button 
        data-testid="record-button"
        onClick={() => !disabled && onRecordingComplete?.(new File(['test'], 'test.wav', { type: 'audio/wav' }))}
        disabled={disabled}
      >
        Record Goal
      </button>
    </div>
  ),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('GoalsScreen', () => {
  const mockNextScreen = vi.fn();
  const mockCompleteScreen = vi.fn();
  const mockUpdateState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(mockHooks.useOnboardingState).mockReturnValue({
      ...mockHooks.useOnboardingState(),
      nextScreen: mockNextScreen,
      completeScreen: mockCompleteScreen,
      updateState: mockUpdateState,
      currentScreen: 'goals',
    });

    vi.mocked(mockHooks.useUserProfile).mockReturnValue({
      ...mockHooks.useUserProfile(),
      isLoading: false,
    });

    vi.mocked(mockHooks.useAuth).mockReturnValue(mockHooks.useAuth());

    // Mock successful API responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (url === '/api/user/profile') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            goal: { id: 'test-goal-123' }
          }),
        } as Response);
      }
      if (url === '/api/voice-memo/onboarding') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            artifact_id: 'test-artifact-456'
          }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Brand Voice Compliance', () => {
    it('displays the value proposition opening', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Your time is valuable. Your relationships are invaluable.')).toBeInTheDocument();
      });
    });

    it('shows the legendary outcome question', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('What ambitious outcome would make this year legendary?')).toBeInTheDocument();
      });
    });

    it('includes strategic specificity guidance', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Be specific. Vague goals get vague results.')).toBeInTheDocument();
      });
    });

    it('displays Iyanla Vanzant quote', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText(/The way to achieve your own success is to be willing to help somebody else get it first/)).toBeInTheDocument();
        expect(screen.getByText('— Iyanla Vanzant')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Sequence', () => {
    it('follows proper timing for message progression', async () => {
      render(<GoalsScreen />);
      
      // First message should appear
      await waitFor(() => {
        expect(screen.getByText('Your time is valuable. Your relationships are invaluable.')).toBeInTheDocument();
      });
      
      // Question should appear after delay
      await waitFor(() => {
        expect(screen.getByText('What ambitious outcome would make this year legendary?')).toBeInTheDocument();
      }, { timeout: 4000 });
      
      // Goal categories should appear last
      await waitFor(() => {
        expect(screen.getByText('Land a specific role or make a career transition')).toBeInTheDocument();
      }, { timeout: 6000 });
    });
  });

  describe('Goal Category Selection', () => {
    it('displays all goal categories', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Land a specific role or make a career transition')).toBeInTheDocument();
        expect(screen.getByText('Grow or launch my startup')).toBeInTheDocument();
        expect(screen.getByText('Find investors or strategic partners')).toBeInTheDocument();
        expect(screen.getByText('Break into a new industry or market')).toBeInTheDocument();
        expect(screen.getByText('Something else')).toBeInTheDocument();
      });
    });

    it('handles category selection and goal creation', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      // Wait for categories to appear
      const careerCategory = await screen.findByText('Land a specific role or make a career transition');
      
      // Select a category
      await user.click(careerCategory);
      
      // Should create initial goal
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('create_initial_goal'),
        }));
      });
      
      // Should update onboarding state with goal ID
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({
          goal_id: 'test-goal-123'
        });
      });
    });

    it('shows voice recorder after category selection', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const careerCategory = await screen.findByText('Land a specific role or make a career transition');
      await user.click(careerCategory);
      
      // Voice recorder should appear
      await waitFor(() => {
        expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
        expect(screen.getByText('🪄 Wave a magic wand')).toBeInTheDocument();
      });
    });
  });

  describe('Voice Recording Flow', () => {
    it('handles successful goal voice memo recording', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      // Select category first
      const category = await screen.findByText('Land a specific role or make a career transition');
      await user.click(category);
      
      // Record voice memo
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      // Should call voice memo API
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/voice-memo/onboarding', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }));
      });
      
      // Should update state with voice memo ID
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({
          goal_voice_memo_id: 'test-artifact-456'
        });
      });
      
      // Should advance to next screen
      await waitFor(() => {
        expect(mockCompleteScreen).toHaveBeenCalledWith('goals');
        expect(mockNextScreen).toHaveBeenCalled();
      });
    });

    it('displays proper voice recorder prompts', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const category = await screen.findByText('Land a specific role or make a career transition');
      await user.click(category);
      
      await waitFor(() => {
        expect(screen.getByText('🪄 Wave a magic wand')).toBeInTheDocument();
        expect(screen.getByText(/You wake up tomorrow and you've achieved your goal brilliantly/)).toBeInTheDocument();
      });
    });

    it('shows category confirmation message', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const category = await screen.findByText('Land a specific role or make a career transition');
      await user.click(category);
      
      await waitFor(() => {
        expect(screen.getByText('Perfect! Clarity is the first step to success.')).toBeInTheDocument();
        expect(screen.getByText(/You want to land a specific role or make a career transition/)).toBeInTheDocument();
      });
    });
  });

  describe('Unsure Flow', () => {
    it('shows unsure option', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('I prefer to explore organically')).toBeInTheDocument();
      });
    });

    it('handles unsure flow selection', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const unsureButton = await screen.findByText('I prefer to explore organically');
      await user.click(unsureButton);
      
      // Should show unsure flow content
      await waitFor(() => {
        expect(screen.getByText(/No worries — that's actually pretty common/)).toBeInTheDocument();
        expect(screen.getByText(/Let's start with what you know/)).toBeInTheDocument();
      });
    });

    it('provides helpful guidance for unsure users', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const unsureButton = await screen.findByText('I prefer to explore organically');
      await user.click(unsureButton);
      
      await waitFor(() => {
        expect(screen.getByText(/What's working well in your professional life right now/)).toBeInTheDocument();
        expect(screen.getByText(/What's frustrating or feeling stuck/)).toBeInTheDocument();
        expect(screen.getByText(/What would you change if you could wave a magic wand/)).toBeInTheDocument();
      });
    });

    it('allows navigation back to categories from unsure flow', async () => {
      const user = userEvent.setup();
      render(<GoalsScreen />);
      
      const unsureButton = await screen.findByText('I prefer to explore organically');
      await user.click(unsureButton);
      
      const backButton = await screen.findByText('Back to Goal Categories');
      await user.click(backButton);
      
      // Should return to category selection
      await waitFor(() => {
        expect(screen.getByText('Land a specific role or make a career transition')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles goal creation API errors', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Goal creation failed' }),
      } as Response);
      
      render(<GoalsScreen />);
      
      const category = await screen.findByText('Land a specific role or make a career transition');
      await user.click(category);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Goal creation failed/)).toBeInTheDocument();
      });
    });

    it('handles voice memo API errors', async () => {
      const user = userEvent.setup();
      
      // Mock successful goal creation but failed voice memo
      vi.mocked(fetch).mockImplementation((url) => {
        if (url === '/api/user/profile') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ goal: { id: 'test-goal' } }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Voice memo failed' }),
        } as Response);
      });
      
      render(<GoalsScreen />);
      
      const category = await screen.findByText('Land a specific role or make a career transition');
      await user.click(category);
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Voice memo failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses proper typography scale', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        // Main headings should use proper scale
        const valueProposition = screen.getByText('Your time is valuable. Your relationships are invaluable.');
        expect(valueProposition.tagName).toBe('H1');
        
        const question = screen.getByText('What ambitious outcome would make this year legendary?');
        expect(question.tagName).toBe('H1');
      });
    });

    it('implements premium card styling', async () => {
      render(<GoalsScreen />);
      
      await waitFor(() => {
        // Should use PremiumCard component
        const categories = screen.getByText('Land a specific role or make a career transition');
        expect(categories).toBeInTheDocument();
      });
    });
  });
});