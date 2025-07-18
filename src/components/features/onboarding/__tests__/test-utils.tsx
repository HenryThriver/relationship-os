import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create a custom theme for testing that includes our brand colors
const testTheme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    sage: {
      light: '#ECFDF5',
      main: '#059669',
      dark: '#047857',
    },
    amber: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
    },
    plum: {
      light: '#F3E8FF',
      main: '#7C3AED',
      dark: '#5B21B6',
    },
  },
});

// Mock onboarding state for testing
export const mockOnboardingState = {
  currentScreen: 0,
  currentScreenName: 'welcome' as const,
  totalScreens: 12,
  isComplete: false,
  completedScreens: [],
  state: {
    challenge_voice_memo_id: null,
    goal_voice_memo_id: null,
    goal_id: null,
    goal_contact_urls: [],
    imported_goal_contacts: [],
    profile_enhancement_voice_memo_id: null,
  },
  isNavigating: false,
  nextScreen: vi.fn(),
  prevScreen: vi.fn(),
  goToScreen: vi.fn(),
  completeScreen: vi.fn(),
  updateState: vi.fn(),
  completeOnboarding: vi.fn(),
  resetOnboarding: vi.fn(),
};

// Mock auth context
export const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
    },
  },
  session: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  loading: false,
};

// Mock user profile
export const mockUserProfile = {
  profile: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    primary_goal: 'Land a senior product manager role at a Fortune 500 company',
    goal_description: 'Focus on companies with strong product cultures and growth opportunities',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

// Create a wrapper with all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={testTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock hooks
export const mockHooks = {
  useOnboardingState: () => mockOnboardingState,
  useAuth: () => mockAuthContext,
  useUserProfile: () => mockUserProfile,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
};

// Helper function to create mock audio file for voice recorder tests
export const createMockAudioFile = (name = 'test-audio.wav'): File => {
  const buffer = new ArrayBuffer(1024);
  return new File([buffer], name, { type: 'audio/wav' });
};

// Helper function to wait for animations
export const waitForAnimation = (duration = 300) => 
  new Promise(resolve => setTimeout(resolve, duration));

// Helper function to simulate voice recording completion
export const simulateVoiceRecording = async (duration = 1000) => {
  await waitForAnimation(duration);
  return createMockAudioFile();
};

export * from '@testing-library/react';
export { customRender as render };