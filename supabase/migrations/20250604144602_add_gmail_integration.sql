-- Add Gmail Integration Schema
-- Migration: 20250604144602_add_gmail_integration.sql

-- Add email artifact type to existing enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'email' AND enumtypid = 'artifact_type_enum'::regtype) THEN
        ALTER TYPE artifact_type_enum ADD VALUE 'email';
    END IF;
END $$;

-- Add Gmail sync tracking table
CREATE TABLE gmail_sync_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_sync_token text,
  last_sync_timestamp timestamptz DEFAULT now(),
  sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message text,
  total_emails_synced integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS and policies for gmail_sync_state
ALTER TABLE gmail_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own Gmail sync state"
  ON gmail_sync_state FOR ALL
  USING (auth.uid() = user_id);

-- Add indexes for email queries
CREATE INDEX IF NOT EXISTS idx_artifacts_email_thread_btree ON artifacts ((metadata->>'thread_id')) WHERE type = 'email';
CREATE INDEX IF NOT EXISTS idx_artifacts_email_message_id_btree ON artifacts ((metadata->>'message_id')) WHERE type = 'email';
CREATE INDEX IF NOT EXISTS idx_artifacts_email_type ON artifacts (type) WHERE type = 'email';

-- Add Gmail-specific columns to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_addresses text[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gmail_labels text[] DEFAULT '{}';

-- User tokens table for OAuth
CREATE TABLE user_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gmail_access_token text,
  gmail_refresh_token text,
  gmail_token_expiry timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- RLS for user tokens
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own tokens"
  ON user_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_gmail_sync_state_updated_at BEFORE UPDATE ON gmail_sync_state 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 