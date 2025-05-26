import type { Database } from '@/lib/supabase/types_db';
import type { ArtifactGlobal, LinkedInArtifactContent } from './artifact'; // Assuming LinkedInArtifactContent is defined here
import type { Json } from '@/lib/supabase/types_db'; // Import Json type

// ----- Professional Context ----- 
export interface ProfessionalAchievementItem {
  event: string;
  date?: string; // Could be a year or a more specific date
  details?: string;
}

export interface ProfessionalContext {
  current_role?: string;
  current_company?: string;
  goals?: string[]; // Professional goals
  background?: {
    focus_areas?: string; // e.g. "B2B SaaS, GTM Strategy, Product-Led Growth"
    education?: string[]; // Brief list: "Stanford MBA", "UC Berkeley CS"
    previous_companies?: string[]; // List of notable past companies
    expertise_areas?: string[]; // e.g. ["AI/ML", "Data Analytics", "Cloud Infrastructure"]
  };
  current_ventures?: string; // For entrepreneurs or those with side projects
  speaking_topics?: string[];
  achievements?: ProfessionalAchievementItem[];
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
}

// ----- Core Contact Type ----- 
export interface Contact extends Partial<Database['public']['Tables']['contacts']['Row']> { 
  // Required fields from DB that are not optional in the interface
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string | null; // Changed to string | null to match DB nullability
  profile_photo_url?: string | null; // Explicitly adding, though Partial should cover it
  
  // JSONB fields - use Json type for DB compatibility, cast to specific types when using
  professional_context?: Json | null;
  personal_context?: Json | null;
  linkedin_data?: Json | null; 

  // Related data that might be joined or fetched separately
  artifacts?: ArtifactGlobal[] | null; 
  // next_connections are handled by useNextConnection hook, not directly on Contact
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