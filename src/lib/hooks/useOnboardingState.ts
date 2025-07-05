import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { 
  OnboardingState, 
  OnboardingStateUpdate, 
  OnboardingScreen,
  OnboardingFlowConfig
} from '@/types/userProfile';
import { Json } from '@/lib/supabase/types_db';

// Onboarding flow configuration
const ONBOARDING_CONFIG: OnboardingFlowConfig = {
  total_screens: 12,
  screen_order: [
    'welcome',              // 1
    'challenges',           // 2
    'recognition',          // 3
    'bridge',               // 4
    'goals',                // 5
    'contacts',             // 6 - Contact Import Screen
    'contact_confirmation', // 7 - Contact Confirmation Screen
    'context_discovery',    // 8 - NEW: Context Discovery Screen
    'linkedin',             // 9
    'processing',           // 10
    'profile',              // 11
    'complete'              // 12
  ],
  required_screens: ['welcome', 'goals', 'contacts', 'contact_confirmation', 'context_discovery', 'complete'],
  optional_screens: ['challenges', 'recognition', 'bridge', 'linkedin', 'processing', 'profile']
};

// Database row type matching Supabase schema
type DatabaseOnboardingState = {
  id: string;
  user_id: string;
  current_screen: number | null;
  completed_screens: number[] | null;
  started_at: string | null;
  last_activity_at: string | null;
  challenge_voice_memo_id: string | null;
  goal_voice_memo_id: string | null;
  profile_enhancement_voice_memo_id: string | null;
  goal_contact_urls: string[] | null;
  imported_goal_contacts: Json | null;
  linkedin_contacts_added: number | null;
  linkedin_connected: boolean | null;
  gmail_connected: boolean | null;
  calendar_connected: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

// Helper function to safely cast Json to typed array
const castImportedGoalContacts = (jsonData: Json | null): OnboardingState['imported_goal_contacts'] => {
  if (!jsonData) return null;
  
  try {
    if (Array.isArray(jsonData)) {
      return jsonData as OnboardingState['imported_goal_contacts'];
    }
    return null;
  } catch {
    return null;
  }
};

// Helper function to cast database row to OnboardingState type
const castToOnboardingState = (item: DatabaseOnboardingState): OnboardingState => ({
  id: item.id,
  user_id: item.user_id,
  current_screen: item.current_screen,
  completed_screens: item.completed_screens,
  started_at: item.started_at,
  last_activity_at: item.last_activity_at,
  challenge_voice_memo_id: item.challenge_voice_memo_id,
  goal_voice_memo_id: item.goal_voice_memo_id,
  profile_enhancement_voice_memo_id: item.profile_enhancement_voice_memo_id,
  goal_contact_urls: item.goal_contact_urls,
  imported_goal_contacts: castImportedGoalContacts(item.imported_goal_contacts),
  linkedin_contacts_added: item.linkedin_contacts_added,
  linkedin_connected: item.linkedin_connected,
  gmail_connected: item.gmail_connected,
  calendar_connected: item.calendar_connected,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

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

      return castToOnboardingState(data);
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
      return castToOnboardingState(data);
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
      return castToOnboardingState(data);
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
      return castToOnboardingState(data);
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
      return castToOnboardingState(data);
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

  // Restart onboarding - clear all data and start fresh
  const restartOnboardingMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user || !state) throw new Error('User not authenticated or state not loaded');
      
      // First, get all voice memo IDs from the onboarding state to delete them
      const voiceMemoIds = [
        state.challenge_voice_memo_id,
        state.goal_voice_memo_id,
        state.profile_enhancement_voice_memo_id
      ].filter((id): id is string => Boolean(id));

      // Delete voice memo artifacts if they exist
      if (voiceMemoIds.length > 0) {
        await supabase
          .from('artifacts')
          .delete()
          .in('id', voiceMemoIds);
      }

      // Reset onboarding state to initial values
      await supabase
        .from('onboarding_state')
        .update({
          current_screen: 1,
          completed_screens: [],
          challenge_voice_memo_id: null,
          goal_voice_memo_id: null,
          profile_enhancement_voice_memo_id: null,
          linkedin_contacts_added: 0,
          linkedin_connected: false,
          gmail_connected: false,
          calendar_connected: false,
          goal_contact_urls: [],
          imported_goal_contacts: null,
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)
        .eq('user_id', user.id);

      // Clear onboarding-related data from user's self-contact record
      await supabase
        .from('contacts')
        .update({
          primary_goal: null,
          goal_description: null,
          goal_timeline: null,
          goal_success_criteria: null,
          onboarding_completed_at: null,
          ways_to_help_others: [],
          introduction_opportunities: [],
          knowledge_to_share: [],
          networking_challenges: [],
          onboarding_voice_memo_ids: [],
          // Reset professional context if it was set during onboarding
          professional_context: null,
          personal_context: null,
        })
        .eq('user_id', user.id)
        .eq('is_self_contact', true);

      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ['onboardingState', user.id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['contacts', user.id] });
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
    restartOnboarding: restartOnboardingMutation.mutateAsync,
    
    // Loading states
    isUpdating: updateStateMutation.isPending,
    isNavigating: nextScreenMutation.isPending || previousScreenMutation.isPending,
    isCompleting: completeOnboardingMutation.isPending,
    isRestarting: restartOnboardingMutation.isPending,
  };
}; 