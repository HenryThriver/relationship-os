export interface ContactUpdateSuggestion {
  field_path: string;
  action: 'add' | 'update' | 'remove';
  current_value?: any;
  suggested_value: any;
  confidence: number;
  reasoning: string;
}

export interface UpdateSuggestionRecord {
  id: string;
  artifact_id: string;
  contact_id: string;
  user_id: string;
  suggested_updates: {
    suggestions: ContactUpdateSuggestion[];
  };
  field_paths: string[];
  confidence_scores: Record<string, number>;
  status: 'pending' | 'approved' | 'rejected' | 'partial' | 'skipped'; // Matches DB CHECK constraint
  user_selections: Record<string, boolean>; // Stores which suggestions user explicitly selected/deselected
  created_at: string;
  reviewed_at?: string;
  applied_at?: string;
  viewed_at?: string; // New: When user viewed the suggestions
  priority?: 'high' | 'medium' | 'low'; // New: Priority level
  dismissed_at?: string; // New: When user dismissed the suggestions
  artifacts?: { // Optional: For joining artifact data like transcription for context in UI
    transcription?: string | null; // Transcription might be null
    created_at: string; // artifact created_at timestamp
  };
} 