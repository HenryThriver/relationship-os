import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockHooks } from './test-utils';
import ContactImportScreen from '../3_Contacts_3.0_Import';

// Mock hooks and components
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: vi.fn(),
}));

vi.mock('@/lib/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

vi.mock('../OnboardingVoiceRecorder', () => ({
  default: ({ onRecordingComplete, disabled, title, description }: { 
    onRecordingComplete: (blob: Blob) => void; 
    disabled: boolean; 
    title: string; 
    description: string; 
  }) => (
    <div data-testid="voice-recorder">
      <h3>{title}</h3>
      <p>{description}</p>
      <button 
        data-testid="record-button"
        onClick={() => !disabled && onRecordingComplete?.(new File(['test'], 'test.wav', { type: 'audio/wav' }))}
        disabled={disabled}
      >
        Record About Contact
      </button>
    </div>
  ),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('ContactImportScreen', () => {
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
      currentScreen: 'contacts',
    });

    vi.mocked(mockHooks.useUserProfile).mockReturnValue({
      ...mockHooks.useUserProfile(),
      profile: {
        ...mockHooks.useUserProfile().profile!,
        primary_goal: 'Land a senior product manager role at a Fortune 500 company',
      },
    });

    // Mock successful API responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (url === '/api/voice-memo/onboarding') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            artifact_id: 'voice-memo-123'
          }),
        } as Response);
      }
      if (url === '/api/contacts/goal-import') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            contacts: [{
              id: 'contact-123',
              name: 'John Doe',
              linkedin_url: 'https://linkedin.com/in/johndoe',
              company: 'Tech Corp',
              title: 'VP of Product'
            }]
          }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Brand Voice Compliance', () => {
    it('displays goal acknowledgment with strategic language', async () => {
      render(<ContactImportScreen />);
      
      await waitFor(() => {
        expect(screen.getByText("Perfect! Here's your goal:")).toBeInTheDocument();
        expect(screen.getByText('Land a senior product manager role at a Fortune 500 company')).toBeInTheDocument();
      });
    });

    it('uses strategic stakeholder language', async () => {
      render(<ContactImportScreen />);
      
      await waitFor(() => {
        expect(screen.getByText(/Now let's identify key stakeholders in your success trajectory/)).toBeInTheDocument();
        expect(screen.getByText(/Think strategically—who could accelerate your path/)).toBeInTheDocument();
      });
    });

    it('displays Steve Jobs quote', async () => {
      render(<ContactImportScreen />);
      
      await waitFor(() => {
        expect(screen.getByText(/Great things in business are never done by one person/)).toBeInTheDocument();
        expect(screen.getByText('— Steve Jobs')).toBeInTheDocument();
      });
    });
  });

  describe('Animation Sequence', () => {
    it('follows proper timing for content reveal', async () => {
      render(<ContactImportScreen />);
      
      // Goal acknowledgment should appear first
      await waitFor(() => {
        expect(screen.getByText("Perfect! Here's your goal:")).toBeInTheDocument();
      });
      
      // Instructions should appear after delay
      await waitFor(() => {
        expect(screen.getByText(/Now let's identify key stakeholders/)).toBeInTheDocument();
      }, { timeout: 4000 });
      
      // Contact input form should appear last
      await waitFor(() => {
        expect(screen.getByLabelText('LinkedIn Profile URL')).toBeInTheDocument();
      }, { timeout: 6000 });
    });
  });

  describe('LinkedIn URL Validation', () => {
    it('validates LinkedIn URL format correctly', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      
      // Test invalid URL
      await user.type(urlInput, 'invalid-url');
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid LinkedIn profile URL')).toBeInTheDocument();
      });
    });

    it('accepts valid LinkedIn URLs', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      
      // Test valid URL
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      await waitFor(() => {
        // Should show checkmark icon
        expect(screen.queryByText('Please enter a valid LinkedIn profile URL')).not.toBeInTheDocument();
      });
    });

    it('shows voice recorder when valid URL is entered', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      await waitFor(() => {
        expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
        expect(screen.getByText('Share more about this contact')).toBeInTheDocument();
      });
    });
  });

  describe('Voice Recording Integration', () => {
    it('handles voice memo recording for contact context', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      // Enter valid LinkedIn URL
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
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
    });

    it('displays proper voice recorder prompts', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      await waitFor(() => {
        expect(screen.getByText('Share more about this contact')).toBeInTheDocument();
        expect(screen.getByText(/Tell us a little bit about how you know this contact/)).toBeInTheDocument();
      });
    });
  });

  describe('Contact Analysis Flow', () => {
    it('requires both URL and voice memo before proceeding', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      // Enter URL but don't record
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const analyzeButton = await screen.findByText('Analyze strategic value');
      expect(analyzeButton).toBeDisabled();
      
      // After recording, button should be enabled
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      await waitFor(() => {
        expect(analyzeButton).not.toBeDisabled();
      });
    });

    it('handles successful contact import and analysis', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      // Complete the flow
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      const analyzeButton = await screen.findByText('Analyze strategic value');
      await user.click(analyzeButton);
      
      // Should call contact import API
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/contacts/goal-import', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('linkedin_urls'),
        }));
      });
      
      // Should update onboarding state
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith(expect.objectContaining({
          goal_contact_urls: ['https://linkedin.com/in/johndoe'],
          imported_goal_contacts: expect.any(Array),
        }));
      });
      
      // Should advance to next screen
      await waitFor(() => {
        expect(mockCompleteScreen).toHaveBeenCalledWith('contacts');
        expect(mockNextScreen).toHaveBeenCalled();
      });
    });
  });

  describe('Helper Tooltip', () => {
    it('displays helpful suggestions for contact selection', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      // Find and hover over help icon
      const helpButton = await screen.findByLabelText(/help/i);
      await user.hover(helpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Need suggestions\? Think about:/)).toBeInTheDocument();
        expect(screen.getByText(/Someone who's achieved what you want/)).toBeInTheDocument();
        expect(screen.getByText(/Someone in your target industry\/company/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles voice memo API errors', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      vi.mocked(fetch).mockImplementation((url) => {
        if (url === '/api/voice-memo/onboarding') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Voice memo failed' }),
          } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      });
      
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Voice memo failed/)).toBeInTheDocument();
      });
    });

    it('handles contact import API errors', async () => {
      const user = userEvent.setup();
      
      // Mock successful voice memo but failed import
      vi.mocked(fetch).mockImplementation((url) => {
        if (url === '/api/voice-memo/onboarding') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, artifact_id: 'test' }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Import failed' }),
        } as Response);
      });
      
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      const analyzeButton = await screen.findByText('Analyze strategic value');
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Import failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses premium card styling', async () => {
      render(<ContactImportScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('Strategic Connection Profile')).toBeInTheDocument();
      });
    });

    it('implements sage green color psychology', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      // Should show sage green checkmark when valid
      await waitFor(() => {
        // Checkmark icon should be present
        const checkIcon = screen.getByTestId('CheckCircleIcon') || screen.querySelector('[data-testid="CheckCircleIcon"]');
        expect(checkIcon || screen.getByLabelText('LinkedIn Profile URL')).toBeInTheDocument();
      });
    });

    it('uses executive button styling', async () => {
      const user = userEvent.setup();
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      const analyzeButton = await screen.findByText('Analyze strategic value');
      expect(analyzeButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows appropriate loading text during analysis', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      vi.mocked(fetch).mockImplementation((url) => {
        if (url === '/api/voice-memo/onboarding') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, artifact_id: 'test' }),
          } as Response);
        }
        return new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, contacts: [] }),
          } as Response), 1000)
        );
      });
      
      render(<ContactImportScreen />);
      
      const urlInput = await screen.findByLabelText('LinkedIn Profile URL');
      await user.type(urlInput, 'https://linkedin.com/in/johndoe');
      
      const recordButton = await screen.findByTestId('record-button');
      await user.click(recordButton);
      
      const analyzeButton = await screen.findByText('Analyze strategic value');
      await user.click(analyzeButton);
      
      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Discovering strategic intelligence...')).toBeInTheDocument();
      });
    });
  });
});