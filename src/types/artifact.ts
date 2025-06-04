import type { Database } from '@/lib/supabase/types_db';

// Define all known artifact type string literals for more robust typing
export type ArtifactTypeEnum = Database['public']['Enums']['artifact_type_enum'];
export type ExtendedArtifactType = 'pog' | 'ask' | 'prompt_set' | 'goal' | 'linkedin_interaction'; // Types not in the DB enum, handled client-side
export type ArtifactType = ArtifactTypeEnum | ExtendedArtifactType;

// Renamed from ArtifactGlobal to BaseArtifact
export interface BaseArtifact<TContent = Record<string, any> | string | null> { 
  id: string;
  contact_id: string;
  user_id: string;
  type: ArtifactType;
  content: TContent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any> | null;
  timestamp: string; 
  created_at: string;
  updated_at: string;
  ai_parsing_status?: 'pending' | 'processing' | 'completed' | 'failed' | null; // Added here
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

export interface LinkedInArtifact extends BaseArtifact<string> { // Assuming content is a string for LinkedIn Profile, specific data in metadata
  type: 'linkedin_profile';
  metadata: LinkedInArtifactContent; // metadata holds the rich object
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

export interface POGArtifact extends BaseArtifact<string> { // Assuming content is a string, specific data in metadata
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

export interface AskArtifact extends BaseArtifact<string> { // Assuming content is a string, specific data in metadata
  type: 'ask';
  metadata: AskArtifactContent;
}

// --- Voice Memo Artifact ---
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VoiceMemoArtifact extends BaseArtifact<string | null> { // Assuming content might hold transcription or be unused
  type: 'voice_memo';
  audio_file_path: string;
  transcription?: string | null; // This could be mapped to `content` if desired
  duration_seconds?: number | null;
  transcription_status: TranscriptionStatus;
  ai_processing_started_at?: string | null;
  ai_processing_completed_at?: string | null;
}

// --- Email Artifact --- UPDATED
// Comprehensive email types are defined in email.ts
// Re-export the main email artifact interface here for consistency
export interface EmailArtifactMetadata {
  subject?: string;
  from?: string | string[];
  to?: string | string[];
  cc?: string | string[];
  date_received?: string; // ISO string
  // More comprehensive types available in email.ts
}
export interface EmailArtifact extends BaseArtifact<string | null> {
  type: 'email';
  metadata?: EmailArtifactMetadata | null; // Allow null for metadata
}

// --- Meeting Artifact --- NEW
export interface MeetingArtifactContent {
  title?: string;
  startTime: string; // Ensure these are present, adjust types if necessary (e.g., Date or string)
  endTime: string;   // Ensure these are present
  location?: string;
  attendees?: Array<{ // This was string[] in metadata, changing to a more structured type
    email: string;
    name?: string;
    responseStatus?: string; // e.g., 'accepted', 'declined', 'tentative'
    isOrganizer?: boolean;
  }>;
  google_calendar_id?: string;
  google_calendar_link?: string;
  google_calendar_html_link?: string;
  organizer?: {
    email: string;
    name?: string;
    self?: boolean;
  };
  duration_minutes?: number;
  recurring_event_id?: string;
  conference_data?: {
    type: 'google_meet' | 'zoom' | 'teams' | 'other';
    join_url?: string;
    conference_id?: string;
  };
  calendar_source?: 'google' | 'outlook' | 'manual';
  last_synced_at?: string;
  notes?: string; // Added for explicit notes content
  transcript?: string; // Added for explicit transcript content
  recording_url?: string; // Added for explicit recording URL
  insights?: { // This was already well-defined in MeetingArtifactMetadata
    actionItems?: Array<{
      id: string;
      description: string;
      assignee?: string;
      dueDate?: string;
      priority: 'high' | 'medium' | 'low';
      completed?: boolean;
    }>;
    keyTopics?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    followUpSuggestions?: Array<{
      id: string; // Added id for follow up suggestions
      type: 'pog' | 'ask' | 'schedule_meeting';
      description: string;
      priority: number;
      reasoning: string;
    }>;
    summary?: string;
    nextSteps?: string[];
  };
}

export interface MeetingArtifact extends BaseArtifact<MeetingArtifactContent> {
  type: 'meeting';
  // metadata can be used for fields not fitting into content, or deprecated if content covers all.
  // For now, let's assume most of the old metadata is now in MeetingArtifactContent.
  // If specific metadata fields are still needed, they can be defined here.
  // Example: metadata?: { some_meeting_specific_flag?: boolean };
}

// --- Note Artifact --- NEW
export interface NoteArtifactMetadata {
  title?: string;
  // content is the note itself
}
export interface NoteArtifact extends BaseArtifact<string> { // Assuming content is the note text
  type: 'note';
  metadata?: NoteArtifactMetadata | null; // Allow null for metadata
}

// --- Loop Artifact --- NEW
export enum LoopStatus {
  IDEA = 'idea',                     // Initial idea/concept  
  QUEUED = 'queued',                 // Ready to offer/ask
  OFFERED = 'offered',               // Offered to contact
  RECEIVED = 'received',             // Received offer/ask from contact
  ACCEPTED = 'accepted',             // They said yes
  DECLINED = 'declined',             // They said no
  IN_PROGRESS = 'in_progress',       // Currently working on it
  PENDING_APPROVAL = 'pending_approval', // Waiting for 3rd party
  DELIVERED = 'delivered',           // Main action completed
  FOLLOWING_UP = 'following_up',     // Post-delivery follow-up
  COMPLETED = 'completed',           // Fully resolved
  ABANDONED = 'abandoned'            // Stopped pursuing
}

export enum LoopType {
  // Giving (POGs)
  INTRODUCTION = 'introduction',
  REFERRAL = 'referral', 
  RESOURCE_SHARE = 'resource_share',
  ADVICE_OFFER = 'advice_offer',
  CONNECTION_FACILITATION = 'connection_facilitation',
  
  // Receiving (Asks)
  INTRODUCTION_REQUEST = 'introduction_request',
  ADVICE_REQUEST = 'advice_request',
  REFERRAL_REQUEST = 'referral_request',
  COLLABORATION_PROPOSAL = 'collaboration_proposal',
  
  // Mutual
  MEETING_COORDINATION = 'meeting_coordination',
  PROJECT_COLLABORATION = 'project_collaboration'
}

export interface LoopAction {
  id: string;
  status: LoopStatus;
  action_type: 'offer' | 'follow_up' | 'check_in' | 'approval_request' | 'delivery' | 'completion';
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface LoopCompletionOutcome {
  outcome: 'successful' | 'unsuccessful' | 'partial';
  satisfaction_score?: number; // e.g., 1-5
  lessons_learned?: string;
}

export interface LoopArtifactContent {
  type: LoopType;
  status: LoopStatus;
  title: string;
  description: string;
  
  // Existing context field, ensure it's properly placed
  context?: string;                    // Why this loop matters
  
  // Participants
  initiator: 'user' | 'contact';
  other_parties?: string[]; // Contact IDs for intros, referrals
  
  // Timeline
  offered_at?: string;
  accepted_at?: string;
  delivered_at?: string;
  completed_at?: string;
  
  // Actions & Follow-ups
  actions: LoopAction[];
  next_action_due?: string;
  
  // Outcome tracking
  outcome?: 'successful' | 'unsuccessful' | 'partial';
  satisfaction_score?: number; // 1-5
  lessons_learned?: string;
  
  // Reciprocity tracking
  reciprocity_value?: number;
  reciprocity_direction: 'giving' | 'receiving';
  
  // Loop sharing & feedback
  shared_with_contact?: boolean;
  feedback_requested?: boolean;
  contact_feedback?: {
    rating: number;
    comments?: string;
    received_at: string; 
  };

  // Enhanced metadata
  expected_timeline?: number;          // Expected duration in days
  urgency?: 'low' | 'medium' | 'high'; // Priority level
  estimated_value?: number;            // 1-5 scale of importance
  success_criteria?: string[];         // What defines success
  inspiration_source?: string;         // What triggered this loop (voice memo, meeting, etc.)
  
  // Template data
  template_id?: string;
  template_used?: boolean;
  
  // Relationship context
  relationship_depth?: 'new' | 'developing' | 'established' | 'close';
  previous_loop_success?: boolean;
}

export interface LoopArtifact extends BaseArtifact<LoopArtifactContent> { 
  type: 'loop'; 
  // content is now correctly typed via the generic parameter TContent = LoopArtifactContent
}

// --- Loop Template --- NEW (Phase 2.3)
export interface LoopTemplateAction { // Structure for actions within a template
  action_type: LoopAction['action_type'];
  default_notes_template?: string; // e.g., "Follow up regarding {{topic}}" (renamed from description_template)
  default_offset_days?: number; // e.g., 7 days after previous action completion or loop start
  default_assignee?: 'user' | 'contact'; // Added as per roadmap
  // Other template-specific action properties
}

export interface LoopTemplate {
  id: string;
  user_id: string;
  name: string;
  loop_type: LoopType; // From existing LoopType enum
  description?: string | null;
  default_title_template?: string | null; // Added
  default_status: LoopStatus; // Added
  reciprocity_direction: 'giving' | 'receiving'; // Added
  default_actions?: LoopTemplateAction[] | null; // JSONB in DB, maps to array of structured actions
  typical_duration?: number | null; // Changed from typical_duration_days to match DB
  follow_up_schedule?: number[] | null; // Changed from follow_up_schedule_days to match DB
  completion_criteria?: string[] | null;
  created_at: string;
  updated_at: string;
}

// --- Loop Analytics --- NEW (Phase 2.4)
export interface LoopStatusTransition {
  status: LoopStatus;       // The status that was transitioned to
  timestamp: string;        // ISO string timestamp of when this status was set
  previous_status?: LoopStatus; // Optional: the status it transitioned from
}

export interface LoopAnalytic {
  id: string;
  user_id: string;
  contact_id: string;
  loop_artifact_id: string; // Foreign key to the LoopArtifact
  loop_type: LoopType;      // Copied from the loop for easier querying/filtering
  
  status_transitions?: LoopStatusTransition[] | null; // JSONB in DB
  
  completion_time_days?: number | null;
  success_score?: number | null;          // e.g., 1-5 scale
  reciprocity_impact?: number | null;   // e.g., -5 (very negative) to +5 (very positive)
  
  created_at: string;
  // updated_at is not in the schema for loop_analytics, but can be added if needed for mutations
}

// Union type for all specific artifacts + a fallback
export type Artifact =
  | LinkedInArtifact
  | POGArtifact
  | AskArtifact
  | VoiceMemoArtifact
  | EmailArtifact
  | MeetingArtifact
  | NoteArtifact
  | LoopArtifact
  | BaseArtifact; // Fallback for generic artifacts or those not yet strictly typed

// It might be useful to have what's stored in the 'artifacts' table directly
export type DatabaseArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];
export type DatabaseArtifactRow = Database['public']['Tables']['artifacts']['Row']; 