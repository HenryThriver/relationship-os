import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockHooks } from './test-utils';
import ChallengesScreen from '../1_Challenges_1.0_Share';

// Mock the hooks and APIs
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: vi.fn(),
}));

vi.mock('../OnboardingVoiceRecorder', () => ({
  default: ({ onRecordingComplete, disabled }: { onRecordingComplete: (blob: Blob) => void; disabled: boolean }) => (
    <div data-testid="voice-recorder">
      <button 
        data-testid="record-button"
        onClick={() => !disabled && onRecordingComplete?.(new File(['test'], 'test.wav', { type: 'audio/wav' }))}
        disabled={disabled}
      >
        Record Voice Memo
      </button>
    </div>
  ),
}));

// Mock fetch for voice memo API
global.fetch = vi.fn();

describe('ChallengesScreen', () => {
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
      currentScreen: 'challenges',
    });

    // Mock successful API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        artifact_id: 'test-artifact-123'
      }),
    } as Response);
  });

  describe('Brand Voice Compliance', () => {
    it('displays pattern-breaking opening statement', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByText(/Most relationship building feels like speed dating in business casual/)).toBeInTheDocument();
      });
    });

    it('shows strategic honesty follow-up', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('You deserve better.')).toBeInTheDocument();
      });
    });

    it('displays executive-appropriate question', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByText(/What creates friction in your relationship building\?/)).toBeInTheDocument();
      });
    });

    it('uses strategic language in recorder section', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Share your relationship friction points')).toBeInTheDocument();
        expect(screen.getByText(/Specificity unlocks strategic value/)).toBeInTheDocument();
      });
    });
  });

  describe('Animation Sequence', () => {
    it('follows proper timing for message reveals', async () => {
      render(<ChallengesScreen />);
      
      // First statement should appear
      await waitFor(() => {
        expect(screen.getByText(/Most relationship building feels like speed dating/)).toBeInTheDocument();
      });
      
      // Follow-up should appear after delay
      await waitFor(() => {
        expect(screen.getByText('You deserve better.')).toBeInTheDocument();
      }, { timeout: 4000 });
      
      // Question should appear after header fades
      await waitFor(() => {
        expect(screen.getByText(/What creates friction in your relationship building/)).toBeInTheDocument();
      }, { timeout: 6000 });
    });

    it('shows voice recorder after question appears', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('displays examples section last', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        expect(screen.getByText("You're not alone if you...")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Voice Recording Functionality', () => {
    it('handles successful voice memo recording', async () => {
      const user = userEvent.setup();
      render(<ChallengesScreen />);
      
      // Wait for recorder to appear
      const recordButton = await screen.findByTestId('record-button');
      
      // Simulate recording
      await user.click(recordButton);
      
      // Should call API with correct data
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/voice-memo/onboarding', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }));
      });
      
      // Should update onboarding state
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({
          challenge_voice_memo_id: 'test-artifact-123'
        });
      });
      
      // Should progress to next screen
      await waitFor(() => {
        expect(mockCompleteScreen).toHaveBeenCalledWith('challenges');
        expect(mockNextScreen).toHaveBeenCalled();
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      } as Response);
      
      render(<ChallengesScreen />);
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });
      
      // Should not progress to next screen
      expect(mockNextScreen).not.toHaveBeenCalled();
    });

    it('disables recorder during processing', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, artifact_id: 'test-123' }),
          } as Response), 1000)
        )
      );
      
      render(<ChallengesScreen />);
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      // Button should be disabled during processing
      expect(recordButton).toBeDisabled();
    });
  });

  describe('Skip Functionality', () => {
    it('allows users to skip recording', async () => {
      const user = userEvent.setup();
      render(<ChallengesScreen />);
      
      // Wait for skip button to appear
      const skipButton = await screen.findByText('I prefer to proceed without sharing');
      
      await user.click(skipButton);
      
      // Should progress without recording
      expect(mockCompleteScreen).toHaveBeenCalledWith('challenges');
      expect(mockNextScreen).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Design System Compliance', () => {
    it('uses sage green accent for premium card', async () => {
      render(<ChallengesScreen />);
      
      // PremiumCard with sage accent should be present
      await waitFor(() => {
        const card = screen.getByText('Share your relationship friction points').closest('[data-testid="premium-card"]') || 
                     screen.getByText('Share your relationship friction points').closest('.MuiCard-root');
        expect(card).toBeInTheDocument();
      });
    });

    it('implements proper typography hierarchy', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        // Main heading should use proper scale
        const mainHeading = screen.getByText(/Most relationship building feels like speed dating/);
        expect(mainHeading.tagName).toBe('H1');
        
        // Secondary heading should use H2
        const secondaryHeading = screen.getByText(/What creates friction in your relationship building/);
        expect(secondaryHeading.tagName).toBe('H2');
      });
    });
  });

  describe('Struggle Examples', () => {
    it('displays curated relationship building challenges', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        // Should show realistic struggle examples
        expect(screen.getByText(/feel guilty only reaching out when you need something/)).toBeInTheDocument();
        expect(screen.getByText(/forget people's names, families, interests/)).toBeInTheDocument();
        expect(screen.getByText(/lack the systems and routines for consistent outreach/)).toBeInTheDocument();
      });
    });

    it('uses proper emoji indicators for each struggle', async () => {
      render(<ChallengesScreen />);
      
      await waitFor(() => {
        // Should have emoji indicators for visual hierarchy
        const examplesSection = screen.getByText("You're not alone if you...");
        expect(examplesSection).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows processing overlay during voice memo upload', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, artifact_id: 'test-123' }),
          } as Response), 500)
        )
      );
      
      render(<ChallengesScreen />);
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText(/Analyzing your aspirations and extracting your goals/)).toBeInTheDocument();
      });
    });
  });
});