import type { Database } from '@/lib/supabase/types_db';

// Moved from src/types/index.ts
export type ArtifactTypeGlobal = Database['public']['Enums']['artifact_type_enum'] | 'pog' | 'ask'; // Add 'pog' and 'ask' if they are not in the DB enum yet

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
export interface POGArtifactContent {
  description: string;
  value_assessment?: string;
  status?: 'queued' | 'offered' | 'in_progress' | 'delivered' | 'closed'; // Example statuses
  // ... other POG-specific fields
}

export interface POGArtifact extends ArtifactGlobal {
  type: 'pog';
  metadata: POGArtifactContent;
}

// --- Ask Artifact --- 
export interface AskArtifactContent {
  request_description: string;
  success_criteria?: string;
  status?: 'queued' | 'requested' | 'in_progress' | 'received' | 'closed'; // Example statuses
  // ... other Ask-specific fields
}

export interface AskArtifact extends ArtifactGlobal {
  type: 'ask';
  metadata: AskArtifactContent;
}

// Discriminated union for more specific artifact handling
export type TypedArtifact =
  | LinkedInArtifact
  | POGArtifact
  | AskArtifact
  // Potentially add other specific artifact types here
  | ArtifactGlobal; // Fallback for generic artifacts

// It might be useful to have types for what's stored in the 'artifacts' table directly
export type DatabaseArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];
export type DatabaseArtifactRow = Database['public']['Tables']['artifacts']['Row']; 