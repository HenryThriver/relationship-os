import type { Contact } from './contact';
import type { VoiceMemoArtifact } from './artifact';

// User Profile - extends Contact for the self-contact approach
export interface UserProfile extends Contact {
  is_self_contact: true;
  
  // Goal Information
  primary_goal?: string | null;
  goal_description?: string | null;
  goal_timeline?: string | null;
  goal_success_criteria?: string | null;
  
  // Profile Completion
  profile_completion_score: number;
  linkedin_analysis_completed_at?: string | null;
  onboarding_completed_at?: string | null;
  
  // Generosity Opportunities
  ways_to_help_others: string[];
  introduction_opportunities: string[];
  knowledge_to_share: string[];
  
  // Networking Challenges
  networking_challenges: string[];
  challenge_feature_mappings?: Array<{challenge: string, featureKey: string}>;
  onboarding_voice_memo_ids: string[];
}

// Onboarding State
export interface OnboardingState {
  id: string;
  user_id: string;
  
  // Flow Progress
  current_screen: number | null;
  completed_screens: number[] | null;
  started_at: string | null;
  last_activity_at: string | null;
  
  // Screen-specific Data
  goal_id?: string | null;
  challenge_voice_memo_id?: string | null;
  goal_voice_memo_id?: string | null;
  profile_enhancement_voice_memo_id?: string | null;
  goal_contact_urls?: string[] | null;
  imported_goal_contacts?: Array<{
    id: string;
    name: string;
    linkedin_url: string;
    company?: string;
    title?: string;
    profile_picture?: string;
    headline?: string;
    recent_posts_count: number;
  }> | null;
  linkedin_contacts_added: number | null;
  
  // Integration Status
  linkedin_connected: boolean | null;
  gmail_connected: boolean | null;
  calendar_connected: boolean | null;
  
  created_at: string | null;
  updated_at: string | null;
}

// Onboarding Screen Types
export type OnboardingScreen = 
  | 'welcome'
  | 'challenges'
  | 'recognition'
  | 'bridge'
  | 'goals'
  | 'contacts'
  | 'contact_confirmation'
  | 'context_discovery'
  | 'linkedin'
  | 'processing'
  | 'profile'
  | 'complete';

// Voice Memo Types for Onboarding
export type OnboardingVoiceMemoType = 'challenge' | 'goal' | 'profile_enhancement';

export interface OnboardingVoiceMemoRequest {
  audio_file: File;
  memo_type: OnboardingVoiceMemoType;
}

export interface OnboardingVoiceMemoResponse {
  success: boolean;
  artifact_id: string;
  transcription?: string;
  analysis?: {
    networking_challenges?: string[];
    goal_insights?: {
      primary_goal: string;
      description: string;
      timeline: string;
      success_criteria: string;
    };
    personal_insights?: string[];
  };
}

// LinkedIn Analysis for User's Own Profile
export interface UserLinkedInAnalysisRequest {
  linkedin_url: string;
}

export interface UserLinkedInAnalysisResponse {
  success: boolean;
  analysis?: {
    professional_interests: string[];
    expertise_areas: string[];
    communication_style: string;
    ways_to_help_others: string[];
    introduction_opportunities: string[];
    knowledge_to_share: string[];
  };
  error?: string;
}

// Profile Update Types
export interface UserProfileUpdate {
  primary_goal?: string;
  goal_description?: string;
  goal_timeline?: string;
  goal_success_criteria?: string;
  networking_challenges?: string[];
  ways_to_help_others?: string[];
  introduction_opportunities?: string[];
  knowledge_to_share?: string[];
  personal_notes?: string;
}

// Onboarding State Update
export interface OnboardingStateUpdate {
  current_screen?: number;
  completed_screens?: number[];
  goal_id?: string; // Sequential goal creation - goal ID created at category selection
  challenge_voice_memo_id?: string;
  goal_voice_memo_id?: string;
  profile_enhancement_voice_memo_id?: string;
  goal_contact_urls?: string[];
  imported_goal_contacts?: Array<{
    id: string;
    name: string;
    linkedin_url: string;
    company?: string;
    title?: string;
    profile_picture?: string;
    headline?: string;
    recent_posts_count: number;
  }>;
  linkedin_connected?: boolean;
  gmail_connected?: boolean;
  calendar_connected?: boolean;
}

// Goal Data Structure
export interface GoalData {
  primary_goal: string;
  description: string;
  timeline: string;
  success_criteria: string;
}

// Profile Completion Scoring
export interface ProfileCompletionMetrics {
  total_score: number;
  max_score: number;
  completion_percentage: number;
  missing_fields: string[];
  suggestions: string[];
}

// Onboarding Flow Configuration
export interface OnboardingFlowConfig {
  total_screens: number;
  screen_order: OnboardingScreen[];
  required_screens: OnboardingScreen[];
  optional_screens: OnboardingScreen[];
}

// Voice Memo Analysis Results
export interface VoiceMemoAnalysisResult {
  artifact: VoiceMemoArtifact;
  analysis: {
    networking_challenges?: string[];
    goal_insights?: GoalData;
    personal_insights?: string[];
    profile_enhancements?: {
      ways_to_help_others?: string[];
      introduction_opportunities?: string[];
      knowledge_to_share?: string[];
    };
  };
} 