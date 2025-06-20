import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { 
  UserProfile, 
  UserProfileUpdate, 
  UserLinkedInAnalysisRequest,
  UserLinkedInAnalysisResponse,
  GoalData,
  ProfileCompletionMetrics
} from '@/types/userProfile';
import type { Contact } from '@/types/contact';

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile (self-contact)
  const {
    data: profile,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_self_contact', true)
        .single();

      if (error) {
        // If no self-contact exists, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .rpc('get_or_create_self_contact', { user_uuid: user.id });

          if (createError) throw createError;

          // Fetch the newly created profile
          const { data: createdProfile, error: fetchError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', newProfile)
            .single();

          if (fetchError) throw fetchError;
          return createdProfile as UserProfile;
        }
        throw error;
      }

      return data as UserProfile;
    },
    enabled: !!user,
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UserProfileUpdate): Promise<UserProfile> => {
      if (!user || !profile) throw new Error('User not authenticated or profile not loaded');

      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['userProfile', user?.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
  });

  // Set goal data
  const setGoalMutation = useMutation({
    mutationFn: async (goalData: GoalData): Promise<UserProfile> => {
      if (!user || !profile) throw new Error('User not authenticated or profile not loaded');

      const { data, error } = await supabase
        .from('contacts')
        .update({
          primary_goal: goalData.primary_goal,
          goal_description: goalData.description,
          goal_timeline: goalData.timeline,
          goal_success_criteria: goalData.success_criteria,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['userProfile', user?.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
  });

  // Analyze user's LinkedIn profile
  const analyzeLinkedInMutation = useMutation({
    mutationFn: async (request: UserLinkedInAnalysisRequest): Promise<UserLinkedInAnalysisResponse> => {
      if (!user || !profile) throw new Error('User not authenticated or profile not loaded');

      const response = await fetch('/api/user/linkedin-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'LinkedIn analysis failed');
      }

      const result = await response.json();

      // Update profile with LinkedIn analysis results
      if (result.success) {
        await updateProfileMutation.mutateAsync({
          ways_to_help_others: result.analysis.ways_to_help_others,
          introduction_opportunities: result.analysis.introduction_opportunities,
          knowledge_to_share: result.analysis.knowledge_to_share,
        });

        // Update professional context with LinkedIn insights
        const currentProfessionalContext = (profile.professional_context as any) || {};
        const professionalContext = {
          ...currentProfessionalContext,
          expertise_areas: result.analysis.expertise_areas,
          professional_interests: result.analysis.professional_interests,
          communication_style: result.analysis.communication_style,
        };

        await supabase
          .from('contacts')
          .update({
            professional_context: professionalContext,
            linkedin_analysis_completed_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
          .eq('user_id', user.id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    },
  });

  // Calculate profile completion
  const calculateProfileCompletion = (userProfile: UserProfile | null): ProfileCompletionMetrics => {
    if (!userProfile) {
      return {
        total_score: 0,
        max_score: 100,
        completion_percentage: 0,
        missing_fields: [],
        suggestions: []
      };
    }

    let score = 0;
    const maxScore = 100;
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Basic info (20 points)
    if (userProfile.name) score += 5;
    else { missingFields.push('name'); suggestions.push('Add your name'); }

    if (userProfile.email) score += 5;
    else { missingFields.push('email'); suggestions.push('Add your email'); }

    if (userProfile.company) score += 5;
    else { missingFields.push('company'); suggestions.push('Add your current company'); }

    if (userProfile.title) score += 5;
    else { missingFields.push('title'); suggestions.push('Add your job title'); }

    // Goals (25 points)
    if (userProfile.primary_goal) score += 10;
    else { missingFields.push('primary_goal'); suggestions.push('Set your primary networking goal'); }

    if (userProfile.goal_description) score += 10;
    else { missingFields.push('goal_description'); suggestions.push('Describe your goal in detail'); }

    if (userProfile.goal_timeline) score += 5;
    else { missingFields.push('goal_timeline'); suggestions.push('Set a timeline for your goal'); }

    // Professional context (25 points)
    if (userProfile.professional_context && Object.keys(userProfile.professional_context).length > 0) {
      score += 15;
    } else {
      missingFields.push('professional_context');
      suggestions.push('Add professional background information');
    }

    if (userProfile.linkedin_url) score += 10;
    else { missingFields.push('linkedin_url'); suggestions.push('Connect your LinkedIn profile'); }

    // Generosity opportunities (20 points)
    if (userProfile.ways_to_help_others?.length > 0) score += 7;
    else { missingFields.push('ways_to_help_others'); suggestions.push('Add ways you can help others'); }

    if (userProfile.introduction_opportunities?.length > 0) score += 7;
    else { missingFields.push('introduction_opportunities'); suggestions.push('Add introduction opportunities'); }

    if (userProfile.knowledge_to_share?.length > 0) score += 6;
    else { missingFields.push('knowledge_to_share'); suggestions.push('Add knowledge you can share'); }

    // Networking challenges (10 points)
    if (userProfile.networking_challenges?.length > 0) score += 10;
    else { missingFields.push('networking_challenges'); suggestions.push('Record networking challenges via voice memo'); }

    return {
      total_score: score,
      max_score: maxScore,
      completion_percentage: Math.round((score / maxScore) * 100),
      missing_fields: missingFields,
      suggestions: suggestions.slice(0, 3) // Top 3 suggestions
    };
  };

  // Get profile completion metrics
  const profileCompletion = profile ? calculateProfileCompletion(profile) : null;

  return {
    profile,
    isLoading,
    isError,
    error,
    profileCompletion,
    updateProfile: updateProfileMutation.mutateAsync,
    setGoal: setGoalMutation.mutateAsync,
    analyzeLinkedIn: analyzeLinkedInMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isSettingGoal: setGoalMutation.isPending,
    isAnalyzingLinkedIn: analyzeLinkedInMutation.isPending,
  };
}; 