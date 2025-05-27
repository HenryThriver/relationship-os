import type { Database } from '@/lib/supabase/types_db';

// Define all known artifact type string literals for more robust typing
export type ArtifactTypeEnum = Database['public']['Enums']['artifact_type_enum'];
export type ExtendedArtifactType = 'pog' | 'ask' | 'prompt_set' | 'goal' | 'loop' | 'linkedin_interaction'; // Types not in the DB enum, handled client-side
export type ArtifactType = ArtifactTypeEnum | ExtendedArtifactType;

export interface ArtifactGlobal {
  id: string;
  contact_id: string;
  user_id: string;
  type: ArtifactType; // Use the more comprehensive ArtifactType
  content: string; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any> | null; // Reverted to 'any' to fix extension errors
  timestamp: string; 
  created_at: string;
  updated_at: string;
}

// --- LinkedIn Artifact --- 
// Based on RapidLinkedInProfile structure mentioned in plan
export interface LinkedInPosition {
  company: string;
  title: string;
  duration?: string;
  description?: string;
  companyName?: string; // from RapidAPI structure
  date1?: string; // from RapidAPI structure (start date)
  date2?: string; // from RapidAPI structure (end date)
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  years?: string;
  schoolName?: string; // from RapidAPI structure
  degreeName?: string; // from RapidAPI structure
  date1?: string; // from RapidAPI structure (start date)
  date2?: string; // from RapidAPI structure (end date)
}

export interface LinkedInSkill {
  name: string;
  // other skill properties if available
}

export interface LinkedInGeo {
  city?: string;
  country?: string;
  full?: string;
}

export interface LinkedInImage {
  url?: string;
  width?: number;
  height?: number;
}

export interface LinkedInArtifactContent {
  profile_url?: string;
  headline?: string;
  about?: string;         // Corresponds to summary
  experience?: LinkedInPosition[]; 
  education?: LinkedInEducation[];
  scraped_at: string;   // ISO date string
  
  // Fields from RapidLinkedInProfile to be included
  firstName?: string;
  lastName?: string;
  name?: string; // Optional: if you store a combined name
  profilePicture?: string; // URL for the profile picture
  backgroundImage?: LinkedInImage[]; // Added for banner image
  skills?: LinkedInSkill[];
  geo?: LinkedInGeo;
  // Add any other fields from RapidLinkedInProfile that are stored in metadata
  company?: string; // Current company, often at top level in some scrapers
  location?: string; // General location string, if different from geo.full
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
}

// --- Email Artifact --- NEW
export interface EmailArtifactMetadata {
  subject?: string;
  from?: string | string[];
  to?: string | string[];
  cc?: string | string[];
  date_received?: string; // ISO string
  // content can be the email body summary, full body in a specific field if needed
}
export interface EmailArtifact extends ArtifactGlobal {
  type: 'email';
  metadata?: EmailArtifactMetadata | null; // Allow null for metadata
}

// --- Meeting Artifact --- NEW
export interface MeetingArtifactMetadata {
  title?: string;
  attendees?: string[];
  meeting_date?: string; // ISO string
  location?: string;
  // content can be meeting notes summary, full notes in a specific field if needed
}
export interface MeetingArtifact extends ArtifactGlobal {
  type: 'meeting';
  metadata?: MeetingArtifactMetadata | null; // Allow null for metadata
}

// --- Note Artifact --- NEW
export interface NoteArtifactMetadata {
  title?: string;
  // content is the note itself
}
export interface NoteArtifact extends ArtifactGlobal {
  type: 'note';
  metadata?: NoteArtifactMetadata | null; // Allow null for metadata
}

// Discriminated union for more specific artifact handling
export type TypedArtifact =
  | LinkedInArtifact
  | POGArtifact
  | AskArtifact
  | VoiceMemoArtifact
  | EmailArtifact     // Added
  | MeetingArtifact   // Added
  | NoteArtifact      // Added
  | ArtifactGlobal; // Fallback for generic artifacts

// It might be useful to have what's stored in the 'artifacts' table directly
export type DatabaseArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];
export type DatabaseArtifactRow = Database['public']['Tables']['artifacts']['Row']; 