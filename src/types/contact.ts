import type { Database } from '@/lib/supabase/types_db';
import type { BaseArtifact } from './artifact';

// ----- Professional Context ----- 
export interface ProfessionalAchievementItem {
  event: string;
  date?: string; // Could be a year or a more specific date
  details?: string;
}

export interface Mentions {
  colleagues?: string[];
  clients?: string[];
  competitors?: string[];
  collaborators?: string[];
  mentors?: string[];
  industry_contacts?: string[];
}

export interface ProfessionalContext {
  current_role?: string;
  current_company?: string;
  goals?: string[]; // Professional goals
  background?: {
    focus_areas?: string; // e.g. "B2B SaaS, GTM Strategy, Product-Led Growth"
    previous_companies?: string[]; // List of notable past companies
    expertise_areas?: string[]; // e.g. ["AI/ML", "Data Analytics", "Cloud Infrastructure"]
  };
  current_ventures?: string; // For entrepreneurs or those with side projects
  speaking_topics?: string[];
  achievements?: ProfessionalAchievementItem[];

  // New fields from AI prompt
  current_role_description?: string;
  key_responsibilities?: string[];
  team_details?: string;
  work_challenges?: string[];
  networking_objectives?: string[];
  skill_development?: string[];
  career_transitions?: string[];
  projects_involved?: string[];
  collaborations?: string[];
  upcoming_projects?: string[];
  skills?: string[]; 
  industry_knowledge?: string[];
  mentions?: Mentions;
  opportunities_to_help?: string[];
  introduction_needs?: string[];
  resource_needs?: string[];
  pending_requests?: string[];
  collaboration_opportunities?: string[];
}

// ----- Personal Context ----- 
export interface FamilyMemberDetail {
    name: string;
    relationship: string; // e.g. "Partner", "Son", "Daughter"
    details?: string; // e.g. "Loves dinosaurs", "Plays soccer"
}

export interface PersonalMilestone {
    emoji?: string;
    event: string; // e.g. "Ran first marathon", "Bought a house"
    date?: string; // e.g. "2023-05-15" or "Summer 2022"
    impact?: string; // How it affected them or the relationship
}

export interface ConversationStarters {
    personal?: string[];
    professional?: string[];
}

export interface PersonalContext {
  family?: {
    partner?: FamilyMemberDetail;
    children?: FamilyMemberDetail[];
    parents?: string; // Free text for now
    siblings?: string; // Free text for now
  };
  interests?: string[]; // e.g. ["Hiking", "Photography", "Jazz Music"]
  values?: string[]; // e.g. ["Integrity", "Continuous Learning"]
  milestones?: PersonalMilestone[];
  anecdotes?: string[]; // Short stories or memorable interactions
  communication_style?: string; // e.g. "Prefers email, direct and to the point"
  relationship_goal?: string; // User's goal for this specific relationship
  conversation_starters?: ConversationStarters;

  // New fields based on expanded AI prompt and UI needs
  key_life_events?: string[];
  current_challenges?: string[];
  upcoming_changes?: string[];
  living_situation?: string;
  hobbies?: string[];
  travel_plans?: string[];
  motivations?: string[];
  education?: string[] | string;
}

// ----- Core Contact Type ----- 
// Base type from Supabase schema
type ContactDbRow = Database['public']['Tables']['contacts']['Row'];

export interface Contact extends ContactDbRow { 
  // All fields are inherited from ContactDbRow.
  // professional_context, personal_context, linkedin_data, field_sources
  // will have the type Json | null as defined in ContactDbRow.

  // Related data that might be joined or fetched separately
  artifacts?: BaseArtifact[] | null; 
  contact_emails?: ContactEmail[];
}

// ----- Next Connection Types ----- 
export interface ConnectionAgendaItem { // DEFINING AND EXPORTING THIS
    id: string;
    text: string;
    type: 'celebrate' | 'open_thread' | 'new_thread';
    completed?: boolean;
}

export interface ConnectionAgenda {
  goal?: string; // Overall goal for this connection
  shared_topics?: string[]; // Topics relevant to both parties
  items?: ConnectionAgendaItem[];
}

// This is based on the next_connections table schema
export interface NextConnection {
  id: string;
  contact_id: string;
  user_id: string;
  connection_type?: string | null; // e.g., 'Coffee Chat', 'Strategy Session', 'Follow-up'
  scheduled_date: string; // TIMESTAMPTZ
  location?: string | null; // Physical or virtual (e.g. Zoom link)
  agenda?: ConnectionAgenda | null; // JSONB
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending_reschedule'; // Example statuses
  created_at: string;
  updated_at: string;
}

// ----- FieldSources Type ----- NEW
export type FieldSources = {
  [fieldPath: string]: string; // Maps a field path (e.g., "personal_context.name") to an artifact_id
};

export interface ContactEmail {
  id: string;
  contact_id: string;
  email: string;
  email_type: 'primary' | 'work' | 'personal' | 'other';
  is_primary: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// Form types for email management
export interface ContactEmailFormData {
  email: string;
  email_type: 'primary' | 'work' | 'personal' | 'other';
  is_primary: boolean;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
} 