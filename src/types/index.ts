import type { Database } from "@/lib/supabase/types_db";

// Basic Artifact types for global Contact
export type ArtifactTypeGlobal = 'note' | 'meeting' | 'pog' | 'ask' | 'milestone' | 'linkedin_profile' | 'conversation_topic' | 'email' | 'call' | 'linkedin_message' | 'linkedin_post' | 'file' | 'other';

export interface ArtifactGlobal {
  id: string;
  type: ArtifactTypeGlobal;
  content: string;
  timestamp: string; // ISO date string
  // Supabase `artifacts` table also has user_id, contact_id, metadata, created_at, updated_at
  // Add them if they are generally needed when fetching artifacts with contacts globally.
  // For now, keeping it simpler for what might be on a generic Contact object.
}

// Define ExperienceItem and EducationItem for global use
export interface ExperienceItem {
  title?: string | null;
  company?: string | null;
  duration?: string | null;
}

export interface EducationItem {
  school?: string | null;
  degree?: string | null;
}

// Define GoalItem and VentureItem for global use (as they are part of ProfessionalSnapshot)
export interface GoalItem {
    id: string;
    text: string;
}

export interface VentureItem {
    id: string;
    name: string;
    description?: string;
}

// Define FamilyMember for global use
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  details?: string | null;
}

// More comprehensive Contact type, closer to Database["public"]["Tables"]["contacts"]["Row"]
export interface Contact {
  id: string; // UUID
  user_id: string; // UUID, from DB
  created_at: string; // Timestampz
  updated_at: string; // Timestampz, from DB
  name: string | null;
  email: string | null;
  company?: string | null; // Added from DB
  title?: string | null;   // Added from DB
  location?: string | null; // Added from DB
  notes?: string | null;    // Added from DB
  linkedin_url: string; // This was NOT NULL
  // Fields from migration that might not be in types_db.ts yet, but good to have
  relationship_score?: number | null;
  last_interaction_date?: string | null; 
  // Add other fields from your DB contacts.Row as needed
  // e.g. phone, relationship_context, tags from the schema.sql found earlier
  phone?: string | null;
  role?: string | null; // from schema.sql (was 'role')
  relationship_context?: string | null; // from schema.sql
  tags?: string[] | null; // from schema.sql
  profile_photo_url?: string | null; // From contact detail page, good to have for consistency
  artifacts?: ArtifactGlobal[] | null; // Added artifacts array

  // Added fields based on page.tsx needs and common profile info
  about?: string | null; 
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  personalInterests?: string[]; 
  professionalExpertise?: string[];
  conversationStarters?: { personal?: string[]; professional?: string[]; };
  familyMembers?: FamilyMember[] | null;
  hisGoals?: GoalItem[] | null;
  currentVentures?: VentureItem[] | null;
  keySkills?: string[] | null;
} 