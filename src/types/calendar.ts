// Google Calendar Integration Types

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    self?: boolean;
    organizer?: boolean;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      name: string;
      iconUri?: string;
    };
    conferenceId?: string;
  };
  recurringEventId?: string;
  created?: string;
  updated?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface ContactEmailMatch {
  contactId: string;
  contactName: string;
  contactEmail: string;
  matchedEmail: string;
  confidence: 'exact' | 'domain' | 'fuzzy';
}

export interface SyncResults {
  success: boolean;
  eventsProcessed: number;
  artifactsCreated: number;
  contactsUpdated: string[];
  errors: Array<{
    eventId?: string;
    error: string;
    timestamp: string;
  }>;
  syncLogId: string;
}

export interface CalendarSyncOptions {
  startDate: Date;
  endDate: Date;
  maxResults?: number;
  includeDeclined?: boolean;
  singleEvents?: boolean;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncLog {
  id: string;
  user_id: string;
  sync_started_at: string;
  sync_completed_at?: string;
  events_processed: number;
  artifacts_created: number;
  contacts_updated: string[];
  errors: Array<{
    eventId?: string;
    error: string;
    timestamp: string;
  }>;
  status: 'in_progress' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface MeetingInsights {
  actionItems: Array<{
    id: string;
    description: string;
    assignee?: string;
    dueDate?: string;
    priority: 'high' | 'medium' | 'low';
    completed?: boolean;
  }>;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  followUpSuggestions: Array<{
    type: 'pog' | 'ask' | 'schedule_meeting';
    description: string;
    priority: number;
    reasoning: string;
  }>;
  summary?: string;
  nextSteps?: string[];
}

export interface MeetingProcessingRequest {
  meetingArtifactId: string;
  contentType: 'notes' | 'transcript' | 'recording';
  content?: string;
  recordingPath?: string;
  contactContext?: {
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationship_context?: string;
  };
}

export interface MeetingPrep {
  contactSummary: string;
  recentInteractions: Array<{
    type: string;
    date: string;
    summary: string;
  }>;
  suggestedTopics: string[];
  actionItemsToFollow: Array<{
    description: string;
    fromMeeting: string;
    dueDate?: string;
  }>;
  relationshipGoals: string[];
}

export interface MeetingOutcomeAnalysis {
  effectiveness: 'high' | 'medium' | 'low';
  goalAchievement: number; // 0-100 percentage
  relationshipImpact: 'positive' | 'neutral' | 'negative';
  followUpRequired: boolean;
  insights: string[];
  recommendations: string[];
} 