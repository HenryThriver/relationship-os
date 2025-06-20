import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { 
  OnboardingState, 
  OnboardingStateUpdate, 
  OnboardingScreen,
  OnboardingFlowConfig
} from '@/types/userProfile';

// Onboarding flow configuration
const ONBOARDING_CONFIG: OnboardingFlowConfig = {
  total_screens: 9,
  screen_order: [
    'welcome',      // 1
    'challenges',   // 2
    'recognition',  // 3
    'bridge',       // 4
    'goals',        // 5
    'linkedin',     // 6
    'processing',   // 7
    'profile',      // 8
    'complete'      // 9
  ],
  required_screens: ['welcome', 'goals', 'complete'],
  optional_screens: ['challenges', 'recognition', 'bridge', 'linkedin', 'processing', 'profile']
};

export const useOnboardingState = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch onboarding state
  const {
    data: state,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['onboardingState', user?.id],
    queryFn: async (): Promise<OnboardingState | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('onboarding_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no onboarding state exists, create one
        if (error.code === 'PGRST116') {
          const { data: newState, error: createError } = await supabase
            .from('onboarding_state')
            .insert({
              user_id: user.id,
              current_screen: 1,
              completed_screens: [],
              started_at: new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) throw createError;
          return newState as OnboardingState;
        }
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  // Update onboarding state
  const updateStateMutation = useMutation({
    mutationFn: async (updates: OnboardingStateUpdate): Promise<OnboardingState> => {
      if (!user || !state) throw new Error('User not authenticated or state not loaded');

      const { data, error } = await supabase
        .from('onboarding_state')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedState) => {
      queryClient.setQueryData(['onboardingState', user?.id], updatedState);
      queryClient.invalidateQueries({ queryKey: ['onboardingState', user?.id] });
    },
  });

  // Complete a screen
  const completeScreenMutation = useMutation({
    mutationFn: async (screenNumber: number): Promise<OnboardingState> => {
      if (!user || !state) throw new Error('User not authenticated or state not loaded');

      const completedScreens = [...(state.completed_screens || [])];
      if (!completedScreens.includes(screenNumber)) {
        completedScreens.push(screenNumber);
      }

      const { data, error } = await supabase
        .from('onboarding_state')
        .update({
          completed_screens: completedScreens,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedState) => {
      queryClient.setQueryData(['onboardingState', user?.id], updatedState);
      queryClient.invalidateQueries({ queryKey: ['onboardingState', user?.id] });
    },
  });

  // Navigate to next screen
  const nextScreenMutation = useMutation({
    mutationFn: async (): Promise<OnboardingState> => {
      if (!user || !state) throw new Error('User not authenticated or state not loaded');

      const nextScreen = Math.min((state.current_screen || 1) + 1, ONBOARDING_CONFIG.total_screens);
      
      const { data, error } = await supabase
        .from('onboarding_state')
        .update({
          current_screen: nextScreen,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedState) => {
      queryClient.setQueryData(['onboardingState', user?.id], updatedState);
      queryClient.invalidateQueries({ queryKey: ['onboardingState', user?.id] });
    },
  });

  // Navigate to previous screen
  const previousScreenMutation = useMutation({
    mutationFn: async (): Promise<OnboardingState> => {
      if (!user || !state) throw new Error('User not authenticated or state not loaded');

      const previousScreen = Math.max((state.current_screen || 1) - 1, 1);
      
      const { data, error } = await supabase
        .from('onboarding_state')
        .update({
          current_screen: previousScreen,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedState) => {
      queryClient.setQueryData(['onboardingState', user?.id], updatedState);
      queryClient.invalidateQueries({ queryKey: ['onboardingState', user?.id] });
    },
  });

  // Mark onboarding as complete
  const completeOnboardingMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      // Update onboarding state
      await updateStateMutation.mutateAsync({
        current_screen: ONBOARDING_CONFIG.total_screens,
        completed_screens: Array.from({ length: ONBOARDING_CONFIG.total_screens }, (_, i) => i + 1),
      });

      // Update user profile to mark onboarding as complete
      await supabase
        .from('contacts')
        .update({
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_self_contact', true);

      // Invalidate user profile cache
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
    },
  });

  // Helper functions
  const getCurrentScreenName = (): OnboardingScreen | null => {
    if (!state || !state.current_screen) return null;
    const screenIndex = state.current_screen - 1;
    return ONBOARDING_CONFIG.screen_order[screenIndex] || null;
  };

  const getScreenByNumber = (screenNumber: number): OnboardingScreen | null => {
    const screenIndex = screenNumber - 1;
    return ONBOARDING_CONFIG.screen_order[screenIndex] || null;
  };

  const getScreenNumber = (screen: OnboardingScreen): number => {
    const index = ONBOARDING_CONFIG.screen_order.indexOf(screen);
    return index >= 0 ? index + 1 : 1;
  };

  const isScreenCompleted = (screenNumber: number): boolean => {
    return state?.completed_screens?.includes(screenNumber) || false;
  };

  const canNavigateToScreen = (screenNumber: number): boolean => {
    if (!state || !state.current_screen) return false;
    
    // Can always go to current screen or earlier
    if (screenNumber <= state.current_screen) return true;
    
    // Can go to next screen if current is completed
    if (screenNumber === state.current_screen + 1 && isScreenCompleted(state.current_screen)) {
      return true;
    }
    
    return false;
  };

  const getProgressPercentage = (): number => {
    if (!state || !state.completed_screens) return 0;
    return Math.round((state.completed_screens.length / ONBOARDING_CONFIG.total_screens) * 100);
  };

  const isOnboardingComplete = (): boolean => {
    if (!state || !state.completed_screens) return false;
    return state.completed_screens.length === ONBOARDING_CONFIG.total_screens;
  };

  return {
    state,
    isLoading,
    isError,
    error,
    config: ONBOARDING_CONFIG,
    
    // Current state helpers
    currentScreen: state?.current_screen || 1,
    currentScreenName: getCurrentScreenName(),
    progressPercentage: getProgressPercentage(),
    isComplete: isOnboardingComplete(),
    
    // Navigation helpers
    canNavigateToScreen,
    isScreenCompleted,
    getScreenByNumber,
    getScreenNumber,
    
    // Actions
    updateState: updateStateMutation.mutateAsync,
    completeScreen: completeScreenMutation.mutateAsync,
    nextScreen: nextScreenMutation.mutateAsync,
    previousScreen: previousScreenMutation.mutateAsync,
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    
    // Loading states
    isUpdating: updateStateMutation.isPending,
    isNavigating: nextScreenMutation.isPending || previousScreenMutation.isPending,
    isCompleting: completeOnboardingMutation.isPending,
  };
}; 