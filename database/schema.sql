-- Relationship OS Database Schema
-- Updated to reflect current production structure
-- Run this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE artifact_type_enum AS ENUM (
  'note',
  'email',
  'call',
  'meeting',
  'linkedin_message',
  'linkedin_post',
  'linkedin_profile',
  'voice_memo',
  'file',
  'loop',
  'other'
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  linkedin_url TEXT,
  location TEXT,
  notes TEXT,
  
  -- Enhanced profile fields
  profile_picture TEXT,
  headline TEXT,
  email_addresses TEXT[] DEFAULT '{}',
  gmail_labels TEXT[] DEFAULT '{}',
  
  -- Context fields
  professional_context JSONB DEFAULT '{}',
  personal_context JSONB DEFAULT '{}',
  field_sources JSONB DEFAULT '{}',
  
  -- Self-contact identification
  is_self_contact BOOLEAN DEFAULT FALSE,
  
  -- LinkedIn data
  linkedin_data JSONB,
  
  -- Goal-related fields
  primary_goal TEXT,
  goal_description TEXT,
  goal_timeline TEXT,
  goal_success_criteria TEXT,
  ways_to_help_others TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create artifacts table
CREATE TABLE artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type artifact_type_enum NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Voice memo fields
  audio_file_path TEXT,
  transcription TEXT,
  duration_seconds INTEGER,
  transcription_status VARCHAR(20) DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- AI processing fields
  ai_parsing_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_parsing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  ai_processing_started_at TIMESTAMPTZ,
  ai_processing_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contact update suggestions table
CREATE TABLE contact_update_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  suggested_updates JSONB NOT NULL,
  field_paths TEXT[] NOT NULL,
  confidence_scores JSONB DEFAULT '{}',
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partial', 'skipped')),
  user_selections JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

-- Loop templates table
CREATE TABLE loop_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  loop_type TEXT NOT NULL,
  description TEXT,
  default_actions JSONB NOT NULL DEFAULT '[]',
  typical_duration INTEGER,
  follow_up_schedule INTEGER[],
  completion_criteria TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loop suggestions table
CREATE TABLE loop_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  source_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE NOT NULL,
  suggestion_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_created')),
  created_loop_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loop analytics table
CREATE TABLE loop_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  loop_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE NOT NULL,
  loop_type TEXT NOT NULL,
  status_transitions JSONB NOT NULL DEFAULT '[]',
  completion_time_days INTEGER,
  success_score DECIMAL(3,2),
  reciprocity_impact DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User integrations table
CREATE TABLE user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- Calendar sync logs table
CREATE TABLE calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  events_processed INTEGER DEFAULT 0,
  artifacts_created INTEGER DEFAULT 0,
  contacts_updated UUID[] DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'
);

-- Gmail sync state table
CREATE TABLE gmail_sync_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_sync_token TEXT,
  last_sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  total_emails_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- LinkedIn sync tracking table
CREATE TABLE linkedin_sync_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  linkedin_url TEXT NOT NULL,
  last_scraped_at TIMESTAMPTZ,
  posts_scraped_count INTEGER DEFAULT 0,
  scrape_status TEXT DEFAULT 'pending' CHECK (scrape_status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, linkedin_url)
);

-- Goals table for multiple goals architecture
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  timeline TEXT,
  success_criteria TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_primary BOOLEAN DEFAULT FALSE,
  
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  voice_memo_id UUID REFERENCES artifacts(id),
  created_from TEXT DEFAULT 'onboarding' CHECK (created_from IN ('onboarding', 'manual', 'ai_suggestion')),
  
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal-contact associations table
CREATE TABLE goal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  relationship_type TEXT,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
  notes TEXT,
  voice_memo_id UUID REFERENCES artifacts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(goal_id, contact_id)
);

-- User profile onboarding table
CREATE TABLE user_profile_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Onboarding progress
  current_step TEXT DEFAULT 'profile',
  completed_steps TEXT[] DEFAULT '{}',
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Voice memo artifacts
  challenge_voice_memo_id UUID REFERENCES artifacts(id),
  goal_voice_memo_id UUID REFERENCES artifacts(id),
  
  -- Challenge mappings
  challenges_identified TEXT[] DEFAULT '{}',
  challenge_feature_mappings JSONB DEFAULT '{}',
  
  -- Goal information
  goals JSONB DEFAULT '[]',
  imported_goal_contacts JSONB DEFAULT '[]',
  goal_contact_urls TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge feature mappings table
CREATE TABLE challenge_feature_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  reasoning TEXT,
  source_artifact_id UUID REFERENCES artifacts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifact processing configuration table
CREATE TABLE artifact_processing_config (
  artifact_type TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  requires_content BOOLEAN DEFAULT FALSE,
  requires_transcription BOOLEAN DEFAULT FALSE,
  requires_metadata_fields TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX contacts_user_id_idx ON contacts(user_id);
CREATE INDEX contacts_name_idx ON contacts(name);
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_company_idx ON contacts(company);
CREATE INDEX contacts_linkedin_url_idx ON contacts(linkedin_url);
CREATE INDEX contacts_is_self_contact_idx ON contacts(is_self_contact);

CREATE INDEX artifacts_contact_id_idx ON artifacts(contact_id);
CREATE INDEX artifacts_user_id_idx ON artifacts(user_id);
CREATE INDEX artifacts_type_idx ON artifacts(type);
CREATE INDEX artifacts_timestamp_idx ON artifacts(timestamp);
CREATE INDEX artifacts_metadata_idx ON artifacts USING GIN(metadata);
CREATE INDEX artifacts_ai_parsing_status_idx ON artifacts(ai_parsing_status);
CREATE INDEX artifacts_transcription_status_idx ON artifacts(transcription_status);

-- Email-specific indexes
CREATE INDEX idx_artifacts_email_thread_btree ON artifacts ((metadata->>'thread_id')) WHERE type = 'email';
CREATE INDEX idx_artifacts_email_message_id_btree ON artifacts ((metadata->>'message_id')) WHERE type = 'email';
CREATE INDEX idx_artifacts_email_type ON artifacts (type) WHERE type = 'email';

-- Transcription search index
CREATE INDEX idx_artifacts_transcription ON artifacts USING GIN (to_tsvector('english', transcription));

-- Suggestions indexes
CREATE INDEX idx_suggestions_contact ON contact_update_suggestions(contact_id);
CREATE INDEX idx_suggestions_artifact ON contact_update_suggestions(artifact_id);
CREATE INDEX idx_suggestions_status ON contact_update_suggestions(status);

-- Loop indexes
CREATE INDEX idx_loop_suggestions_user_contact ON loop_suggestions(user_id, contact_id);
CREATE INDEX idx_loop_suggestions_status ON loop_suggestions(status, created_at);
CREATE INDEX idx_loop_templates_user_type ON loop_templates(user_id, loop_type);
CREATE INDEX idx_loop_analytics_user_contact ON loop_analytics(user_id, contact_id);
CREATE INDEX idx_loop_analytics_completion ON loop_analytics(completion_time_days, success_score);

-- Goals indexes
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_is_primary ON goals(is_primary);
CREATE INDEX idx_goal_contacts_goal_id ON goal_contacts(goal_id);
CREATE INDEX idx_goal_contacts_contact_id ON goal_contacts(contact_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER on_contacts_updated
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_user_integrations_updated
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_loop_templates_updated
  BEFORE UPDATE ON loop_templates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_loop_suggestions_updated
  BEFORE UPDATE ON loop_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_linkedin_sync_tracking_updated
  BEFORE UPDATE ON linkedin_sync_tracking
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_goals_updated
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_goal_contacts_updated
  BEFORE UPDATE ON goal_contacts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_user_profile_onboarding_updated
  BEFORE UPDATE ON user_profile_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_update_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_sync_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_feature_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_processing_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts table
CREATE POLICY "Users can manage their own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for artifacts table
CREATE POLICY "Users can manage their own artifacts" ON artifacts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for other tables
CREATE POLICY "Users can manage their own suggestions" ON contact_update_suggestions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own loop templates" ON loop_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own loop suggestions" ON loop_suggestions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own loop analytics" ON loop_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations" ON user_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar sync logs" ON calendar_sync_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Gmail sync state" ON gmail_sync_state
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own LinkedIn sync tracking" ON linkedin_sync_tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goal contacts" ON goal_contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own onboarding data" ON user_profile_onboarding
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own challenge mappings" ON challenge_feature_mappings
  FOR ALL USING (auth.uid() = user_id);

-- Service role can manage artifact processing config
CREATE POLICY "Service role can manage artifact processing config" ON artifact_processing_config
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON artifact_processing_config TO authenticated;
GRANT ALL ON artifact_processing_config TO service_role; 