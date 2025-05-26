export interface ProfessionalContext {
  goals?: string[]; // ["Beyond Connections for corporate", "Speaking engagements"]
  background?: {
    education?: string[]; // ["Yale University (Economics)", "London School of Economics"]
    previous_companies?: string[]; // ["JPMorgan", "Lehman Brothers", "Cross Campus"]
    expertise_areas?: string[]; // ["Executive Coaching", "Leadership Development"]
    focus_areas?: string; // "Executive coaching, leadership team development..."
  };
  current_ventures?: string; // "Partner at Ferrazzi Greenlight, Co-founder of Connected Success"
  speaking_topics?: string[];
  achievements?: Array<{
    event: string; // "Recent Keynote for Fortune 50 company"
    date?: string;
    details?: string;
  }>;
}

export interface PersonalContext {
  family?: {
    partner?: { 
      name: string; // "Julia"
      details?: string; // "Recently moved in together, combining families"
    };
    children?: Array<{ 
      name: string; // "Sebastian", "Gabriel"
      relationship: string; // "Son", "Partner's Son"
      details?: string;
    }>;
    parents?: string;
    siblings?: string;
  };
  interests?: string[]; // ["Intentional Breathwork", "Meditation", "Health & Wellness"]
  values?: string[]; // ["Family", "Personal Growth", "Resilience"]
  milestones?: Array<{
    event: string; // "Recently moved in with partner Julia"
    date?: string;
    emoji?: string; // "🏡"
    impact?: 'positive' | 'negative' | 'neutral'; // for color coding
  }>;
  anecdotes?: string[]; // ["Attended Yale at 16", "Manages ADHD"]
  communication_style?: string; // "Prefers morning calls", "Direct communicator"
  relationship_goal?: string; // "Deepen connection & explore collaboration"
  conversation_starters?: {
    personal?: string[]; // ["How is settling into the new combined family home..."]
    professional?: string[]; // ["What are the biggest shifts you're seeing..."]
  };
}

// Forward declaration for LinkedInArtifactContent to avoid circular dependency if it were in this file.
// Assuming it will be defined in artifact.ts and re-exported via index.ts or directly imported.
// For now, using 'any' as a placeholder until artifact.ts is processed.
// Ideally, this would be: import type { LinkedInArtifactContent } from './artifact';
type LinkedInArtifactContent = any; 

export interface Contact {
  id: string; // UUID
  user_id: string; // UUID, from DB
  
  // Core fields
  name: string;
  email?: string;
  company?: string;
  title?: string;
  location?: string; // "Los Angeles Area"
  linkedin_url: string; // Existing field, NOT NULL in DB
  
  // Relationship management
  relationship_score: number; // Integer 0-6 (displayed as RQ 3, RQ 5, etc.)
  last_interaction_date?: string; // Timestampz
  connection_cadence_days: number; // 42 = "Connect every 6 weeks"
  
  // Rich context (JSON)
  professional_context: ProfessionalContext;
  personal_context: PersonalContext;
  linkedin_data?: LinkedInArtifactContent | null; // To store structured LinkedIn data
  
  created_at: string; // Timestampz
  updated_at: string; // Timestampz

  // Array of artifacts associated with the contact.
  // Assuming ArtifactGlobal will be defined in artifact.ts
  // For now, using 'any' as a placeholder.
  // Ideally, this would be: import type { ArtifactGlobal } from './artifact';
  artifacts?: any[] | null; 
  
  // Other fields that were on the old Contact/PageContact that might still be needed or are from DB
  notes?: string | null;
  phone?: string | null;
  role?: string | null; 
  relationship_context?: string | null; 
  tags?: string[] | null; 
  profile_photo_url?: string | null;
}

export interface ConnectionAgenda {
  celebrate?: Array<{
    item: string; // "His recent Fortune 50 talk"
    emoji?: string; // "🎉"
  }>;
  follow_up?: Array<{
    item: string; // "AI-based people research event"
    emoji?: string; // "🔗"
  }>;
  new_topics?: Array<{
    item: string; // "Discuss event with Guru"
    emoji?: string; // "💡"
  }>;
}

export interface NextConnection {
  id: string; // UUID
  contact_id: string; // UUID
  user_id: string; // UUID
  
  connection_type: string; // "Video Call", 'coffee', 'event' etc.
  scheduled_date?: string; // Timestampz "Tuesday, May 20th @ 10:00 AM"
  location?: string; // "Virtual (Zoom)", "Starbucks downtown"
  
  agenda: ConnectionAgenda;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  
  created_at: string; // Timestampz
  updated_at: string; // Timestampz
} 