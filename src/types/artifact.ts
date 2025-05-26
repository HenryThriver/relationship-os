import type { Database } from '@/lib/supabase/types_db';

// Moved from src/types/index.ts
export type ArtifactTypeGlobal = Database['public']['Enums']['artifact_type_enum'] | 'pog' | 'ask' | 'voice_memo'; // Add 'pog', 'ask', 'voice_memo'

export interface ArtifactGlobal {
  id: string;
  contact_id: string; // Added, as it's essential for an artifact
  user_id: string; // Added, for consistency and RLS
  type: ArtifactTypeGlobal;
  content: string; // For simple artifacts, or a summary for complex ones
  metadata?: Record<string, any> | null; // For structured data of complex artifacts
  timestamp: string; // ISO date string
  created_at: string;
  updated_at: string;
}

// --- LinkedIn Artifact --- 
export interface LinkedInArtifactContent {
  profile_url?: string;
  headline?: string;
  about?: string;
  experience?: Array<{
    company: string;
    title: string;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    years?: string;
  }>;
  scraped_at: string; // ISO date string
}

export interface LinkedInArtifact extends ArtifactGlobal {
  type: 'linkedin_profile';
  metadata: LinkedInArtifactContent;
}

// --- POG (Packet of Generosity) Artifact --- 
export type POGArtifactContentStatus = 'brainstorm' | 'queued' | 'offered' | 'in_progress' | 'delivered' | 'closed';

export interface POGArtifactContent {
  description: string;
  value_assessment?: string;
  status?: POGArtifactContentStatus;
  type_of_pog?: 'intro' | 'endorsement' | 'advice' | 'reference' | 'other';
  // ... other POG-specific fields
}

export interface POGArtifact extends ArtifactGlobal {
  type: 'pog';
  metadata: POGArtifactContent;
}

// --- Ask Artifact --- 
export type AskArtifactContentStatus = 'queued' | 'requested' | 'in_progress' | 'received' | 'closed';

export interface AskArtifactContent {
  request_description: string;
  success_criteria?: string;
  status?: AskArtifactContentStatus;
  type_of_ask?: 'feedback' | 'intro' | 'help' | 'question' | 'other';
  // ... other Ask-specific fields
}

export interface AskArtifact extends ArtifactGlobal {
  type: 'ask';
  metadata: AskArtifactContent;
}

// --- Voice Memo Artifact ---
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VoiceMemoArtifact extends ArtifactGlobal {
  type: 'voice_memo';
  audio_file_path: string;
  transcription?: string | null;
  duration_seconds?: number | null;
  transcription_status: TranscriptionStatus;
  ai_parsing_status?: string | null;
  ai_processing_started_at?: string | null;
  ai_processing_completed_at?: string | null;
  // content: string; // Inherited from ArtifactGlobal, can be used for a title/note
  // metadata?: Record<string, any> | null; // Inherited from ArtifactGlobal
}

// Discriminated union for more specific artifact handling
export type TypedArtifact =
  | LinkedInArtifact
  | POGArtifact
  | AskArtifact
  | VoiceMemoArtifact // Added VoiceMemoArtifact
  // Potentially add other specific artifact types here
  | ArtifactGlobal; // Fallback for generic artifacts

// It might be useful to have types for what's stored in the 'artifacts' table directly
export type DatabaseArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];
export type DatabaseArtifactRow = Database['public']['Tables']['artifacts']['Row']; 