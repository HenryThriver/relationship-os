import type { Database } from '@/lib/supabase/types_db';
import type { BaseArtifact } from './artifact';

// Gmail API Response Types
export interface GmailApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailAttachment {
  attachmentId: string;
  size: number;
  filename?: string;
  mimeType?: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailMessageHeader[];
  body?: {
    attachmentId?: string;
    size: number;
    data?: string;
  };
  parts?: GmailMessagePayload[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: GmailMessagePayload;
  sizeEstimate?: number;
  historyId?: string;
  internalDate?: string;
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailListResponse<T> {
  messages?: T[];
  threads?: T[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Email Participant Interface
export interface EmailParticipant {
  email: string;
  name?: string;
}

// Email Reference Interface for threading
export interface EmailReference {
  message_id: string;
  subject?: string;
  date?: string;
}

// Meeting reference from email content
export interface MeetingReference {
  type: 'calendar_event' | 'proposed_meeting' | 'meeting_mention';
  date?: string;
  location?: string;
  attendees?: string[];
  confidence: number; // 0-1 confidence score from AI
}

// Core Email Artifact Content
export interface EmailArtifactContent {
  // Core Gmail data
  message_id: string;
  thread_id: string;
  subject: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc?: EmailParticipant[];
  bcc?: EmailParticipant[];
  date: string; // ISO string
  body_text?: string;
  body_html?: string;
  snippet: string;
  
  // Threading metadata
  thread_position: number; // Position in thread (1-based)
  thread_length: number; // Total messages in thread
  in_reply_to?: string; // Message ID this is replying to
  references?: string[]; // All referenced message IDs
  
  // Gmail metadata
  labels: string[];
  is_read: boolean;
  is_starred: boolean;
  size_estimate?: number;
  internal_date?: string; // Gmail's internal date
  history_id?: string;
  
  // Attachments
  attachments?: GmailAttachment[];
  has_attachments: boolean;
  
  // AI analysis results
  email_type?: 'introduction' | 'follow_up' | 'meeting_request' | 'general' | 'newsletter' | 'transactional';
  sentiment?: 'positive' | 'neutral' | 'negative';
  action_items?: string[];
  meeting_references?: MeetingReference[];
  mentions_contact?: boolean;
  priority_level?: 'high' | 'medium' | 'low';
  
  // Loop integration
  loop_id?: string;
  related_loops?: string[]; // IDs of related loops
  
  // Contact matching
  matched_contacts?: string[]; // Contact IDs that were matched
  unmatched_emails?: string[]; // Email addresses that couldn't be matched
  
  // Sync metadata
  sync_source: 'gmail_api' | 'manual' | 'import';
  last_synced_at: string;
}

// Email Artifact extends BaseArtifact
export interface EmailArtifact extends BaseArtifact<string> {
  type: 'email';
  content: string; // Email body or summary stored as string
  metadata: EmailArtifactContent; // Rich structured data in metadata
}

// Thread grouping for UI display
export interface EmailThread {
  thread_id: string;
  subject: string;
  participants: EmailParticipant[];
  message_count: number;
  unread_count: number;
  has_starred: boolean;
  has_attachments: boolean;
  latest_date: string;
  earliest_date: string;
  labels: string[];
  
  // Messages in chronological order
  messages: EmailArtifact[];
  
  // Enhanced thread properties
  direction: 'sent' | 'received' | 'mixed';
  sent_count: number;
  received_count: number;
  importance: 'high' | 'normal' | 'low';
  
  // Thread summary from AI
  summary?: string;
  key_topics?: string[];
  action_items?: string[];
  
  // UI state
  is_expanded?: boolean;
  selected_message_id?: string;
}

// Gmail sync state
export interface GmailSyncState {
  id: string;
  user_id: string;
  last_sync_token?: string;
  last_sync_timestamp: string;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message?: string;
  total_emails_synced: number;
  created_at: string;
  updated_at: string;
}

// User tokens for OAuth
export interface UserTokens {
  id: string;
  user_id: string;
  gmail_access_token?: string;
  gmail_refresh_token?: string;
  gmail_token_expiry?: string;
  created_at: string;
  updated_at: string;
}

// Email import request
export interface EmailImportRequest {
  contact_id: string;
  email_addresses: string[];
  date_range?: {
    start: string; // ISO date
    end: string; // ISO date
  };
  max_results?: number;
  include_labels?: string[];
  exclude_labels?: string[];
}

// Email sync progress
export interface EmailSyncProgress {
  total_emails: number;
  processed_emails: number;
  created_artifacts: number;
  updated_artifacts: number;
  errors: number;
  current_status: string;
  estimated_completion?: string;
}

// Gmail connection status
export interface GmailConnectionStatus {
  is_connected: boolean;
  email_address?: string;
  connection_date?: string;
  last_sync?: string;
  total_emails_synced?: number;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message?: string;
  permissions?: string[]; // OAuth scopes granted
}

// Email search filters
export interface EmailSearchFilters {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  has_attachments?: boolean;
  is_starred?: boolean;
  is_unread?: boolean;
  labels?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  thread_id?: string;
  contact_ids?: string[];
}

// Email actions
export type EmailAction = 
  | 'mark_read'
  | 'mark_unread'
  | 'add_star'
  | 'remove_star'
  | 'add_label'
  | 'remove_label'
  | 'archive'
  | 'delete'
  | 'create_loop'
  | 'link_to_loop';

export interface EmailActionRequest {
  message_ids: string[];
  action: EmailAction;
  params?: {
    label_id?: string;
    loop_id?: string;
    loop_type?: string;
  };
}

// Database type exports
// TODO: Add these types when the database tables are available
// export type GmailSyncStateRow = Database['public']['Tables']['gmail_sync_state']['Row'];
// export type GmailSyncStateInsert = Database['public']['Tables']['gmail_sync_state']['Insert'];
// export type GmailSyncStateUpdate = Database['public']['Tables']['gmail_sync_state']['Update'];

// export type UserTokensRow = Database['public']['Tables']['user_tokens']['Row'];
// export type UserTokensInsert = Database['public']['Tables']['user_tokens']['Insert'];
// export type UserTokensUpdate = Database['public']['Tables']['user_tokens']['Update'];

// Email artifact helpers
export interface EmailArtifactMetadata extends EmailArtifactContent {}

// Re-export for backward compatibility
export type { EmailArtifactContent as EmailMetadata }; 