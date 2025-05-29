export interface MeetingAttendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction' | 'organizer';
  isOrganizer?: boolean;
  // Add any other attendee-specific fields you might get from Google Calendar or want to store
}

export interface ActionItem {
  id: string; // Can be a UUID generated on the client or server
  description: string;
  assignee?: string; // Could be a user ID, contact ID, or just a name string
  dueDate?: string; // ISO date string
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  // Link to the artifact this action item belongs to if stored separately
  // artifact_id?: string; 
}

export interface FollowUpSuggestion {
  id: string; // Can be a UUID
  type: 'pog' | 'ask' | 'schedule_meeting' | 'note' | 'other';
  description: string;
  priority: number; // e.g., 1 (high) to 5 (low)
  reasoning?: string; // Why this suggestion is being made
  status?: 'pending' | 'accepted' | 'dismissed';
  // Link to the artifact this suggestion originated from
  // source_artifact_id?: string;
  // Details specific to the type of follow-up
  // e.g., for 'schedule_meeting', suggested_attendees?: string[]; suggested_time?: string;
}

// You might also want a type for the overall Meeting Insights object if it's used elsewhere
// export interface MeetingInsights {
//   actionItems?: ActionItem[];
//   keyTopics?: string[];
//   sentiment?: 'positive' | 'neutral' | 'negative';
//   followUpSuggestions?: FollowUpSuggestion[];
//   summary?: string;
//   nextSteps?: string[];
// } 