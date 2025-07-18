import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingState } from '../useOnboardingState';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: {
            current_screen: 0,
            completed_screens: [],
            onboarding_state: {},
            is_complete: false,
          },
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    })),
    upsert: vi.fn(() => Promise.resolve({ data: {}, error: null }))
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock auth context
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

describe('useOnboardingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default state', async () => {
      const { result } = renderHook(() => useOnboardingState());
      
      // Should start loading
      expect(result.current.isNavigating).toBe(true);
      
      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });

    it('loads existing onboarding state from database', async () => {
      const existingState = {
        current_screen: 3,
        completed_screens: [0, 1, 2],
        onboarding_state: {
          challenge_voice_memo_id: 'memo-123',
          goal_id: 'goal-456'
        },
        is_complete: false
      };

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: existingState,
              error: null
            })
          })
        })
      }));

      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentScreen).toBe(3);
      expect(result.current.completedScreens).toEqual([0, 1, 2]);
      expect(result.current.state).toEqual({
        challenge_voice_memo_id: 'memo-123',
        goal_id: 'goal-456'
      });
    });
  });

  describe('Screen Navigation', () => {
    it('advances to next screen', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialScreen = result.current.currentScreen;

      await act(async () => {
        await result.current.nextScreen();
      });

      expect(result.current.currentScreen).toBe(initialScreen + 1);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding');
    });

    it('goes to previous screen', async () => {
      // Start with screen 2
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                current_screen: 2,
                completed_screens: [0, 1],
                onboarding_state: {},
                is_complete: false
              },
              error: null
            })
          })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: {}, error: null })
        })
      }));

      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.prevScreen();
      });

      expect(result.current.currentScreen).toBe(1);
    });

    it('prevents going to previous screen from first screen', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialScreen = result.current.currentScreen;

      await act(async () => {
        await result.current.prevScreen();
      });

      // Should stay at first screen
      expect(result.current.currentScreen).toBe(initialScreen);
    });

    it('goes to specific screen', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.goToScreen(5);
      });

      expect(result.current.currentScreen).toBe(5);
    });
  });

  describe('Screen Completion', () => {
    it('marks screen as completed', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.completeScreen('welcome');
      });

      expect(result.current.completedScreens).toContain(0); // welcome is screen 0
    });

    it('prevents duplicate completion', async () => {
      // Start with welcome already completed
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                current_screen: 1,
                completed_screens: [0],
                onboarding_state: {},
                is_complete: false
              },
              error: null
            })
          })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: {}, error: null })
        })
      }));

      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialCompleted = result.current.completedScreens.length;

      await act(async () => {
        await result.current.completeScreen('welcome');
      });

      // Should not add duplicate
      expect(result.current.completedScreens.length).toBe(initialCompleted);
    });
  });

  describe('State Management', () => {
    it('updates onboarding state', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const newState = {
        challenge_voice_memo_id: 'new-memo-123',
        goal_id: 'new-goal-456'
      };

      await act(async () => {
        await result.current.updateState(newState);
      });

      expect(result.current.state).toEqual(expect.objectContaining(newState));
    });

    it('merges state updates', async () => {
      // Start with existing state
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                current_screen: 0,
                completed_screens: [],
                onboarding_state: {
                  challenge_voice_memo_id: 'existing-memo'
                },
                is_complete: false
              },
              error: null
            })
          })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: {}, error: null })
        })
      }));

      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.updateState({
          goal_id: 'new-goal'
        });
      });

      expect(result.current.state).toEqual({
        challenge_voice_memo_id: 'existing-memo',
        goal_id: 'new-goal'
      });
    });
  });

  describe('Onboarding Completion', () => {
    it('completes onboarding', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('resets onboarding state', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Complete some screens first
      await act(async () => {
        await result.current.completeScreen('welcome');
        await result.current.nextScreen();
      });

      await act(async () => {
        await result.current.resetOnboarding();
      });

      expect(result.current.currentScreen).toBe(0);
      expect(result.current.completedScreens).toEqual([]);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('Screen Name Mapping', () => {
    it('maps screen numbers to names correctly', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.currentScreenName).toBe('welcome');

      await act(async () => {
        await result.current.goToScreen(1);
      });

      expect(result.current.currentScreenName).toBe('challenges');

      await act(async () => {
        await result.current.goToScreen(4);
      });

      expect(result.current.currentScreenName).toBe('goals');
    });

    it('handles invalid screen numbers', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.goToScreen(999);
      });

      // Should not crash and should use unknown screen name
      expect(result.current.currentScreenName).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      }));

      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should initialize with defaults despite error
      expect(result.current.currentScreen).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });

    it('handles update errors', async () => {
      const { result } = renderHook(() => useOnboardingState());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Mock update error
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => Promise.resolve({
            data: null,
            error: { message: 'Update failed' }
          })
        })
      }));

      // Should not throw error
      await act(async () => {
        await expect(result.current.updateState({ test: 'value' })).resolves.not.toThrow();
      });
    });
  });

  describe('Loading States', () => {
    it('manages navigation loading state', async () => {
      const { result } = renderHook(() => useOnboardingState());

      expect(result.current.isNavigating).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isNavigating).toBe(false);

      // Should set loading during navigation
      act(() => {
        result.current.nextScreen();
      });

      expect(result.current.isNavigating).toBe(true);
    });
  });
});