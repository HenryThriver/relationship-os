-- supabase/migrations/20250525221811_add_ai_parsing_system.sql

-- Add AI parsing status to artifacts
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS ai_parsing_status VARCHAR(20) DEFAULT 'pending';
-- Ensure the CHECK constraint for ai_parsing_status on the artifacts table matches its intended states
-- (pending, processing, completed, failed, skipped) as discussed.
-- If there's an existing constraint with a different name, it might need to be dropped first.
-- For now, assuming we are adding it or it aligns.
ALTER TABLE artifacts ADD CONSTRAINT check_ai_parsing_status 
  CHECK (ai_parsing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped'));

-- Table for storing AI suggestions before user approval
CREATE TABLE contact_update_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  suggested_updates JSONB NOT NULL,
  field_paths TEXT[] NOT NULL,
  confidence_scores JSONB DEFAULT '{}',
  
  status VARCHAR(20) DEFAULT 'pending',
  user_selections JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

-- Add CHECK constraint for contact_update_suggestions.status
-- Adjusted to include 'pending', 'approved', 'rejected', 'partial', 'skipped'
ALTER TABLE contact_update_suggestions ADD CONSTRAINT check_suggestion_status
  CHECK (status IN ('pending', 'approved', 'rejected', 'partial', 'skipped'));

-- Add source attribution to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS field_sources JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX idx_suggestions_contact ON contact_update_suggestions(contact_id);
CREATE INDEX idx_suggestions_artifact ON contact_update_suggestions(artifact_id);
CREATE INDEX idx_suggestions_status ON contact_update_suggestions(status);
CREATE INDEX idx_contacts_field_sources ON contacts USING GIN (field_sources);

-- RLS policies
ALTER TABLE contact_update_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestions" ON contact_update_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON contact_update_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 3: Database Trigger for Auto-Parsing

-- Function to trigger AI parsing Edge Function (using Vault for service key)
CREATE OR REPLACE FUNCTION trigger_ai_parsing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
BEGIN
  -- Retrieve the service role key from Supabase Vault
  BEGIN
    SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' LIMIT 1;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Could not retrieve INTERNAL_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
    service_key := NULL; -- Ensure service_key is NULL if retrieval fails
  END;

  IF service_key IS NULL THEN
    RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault or retrieval failed. Skipping AI parsing trigger for artifact ID %.', NEW.id;
    RETURN NEW;
  END IF;

  -- Retrieve the Edge Function base URL
  BEGIN
    edge_function_base_url := current_setting('app.edge_function_url');
  EXCEPTION WHEN others THEN
    RAISE WARNING 'app.edge_function_url not set. Error: %', SQLERRM;
    edge_function_base_url := NULL; -- Ensure it's NULL if retrieval fails
  END;

  IF edge_function_base_url IS NULL OR edge_function_base_url = '' THEN
    RAISE WARNING 'app.edge_function_url is not configured. Skipping AI parsing trigger for artifact ID %.', NEW.id;
    RETURN NEW;
  END IF;

  -- Check if the updated row is a voice memo, transcription is completed,
  -- AI parsing is pending, and transcription content exists.
  IF NEW.type = 'voice_memo' 
     AND NEW.transcription_status = 'completed' 
     AND NEW.ai_parsing_status = 'pending' 
     AND NEW.transcription IS NOT NULL THEN
    
    RAISE LOG 'Attempting to trigger AI parsing for artifact ID: %', NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-voice-memo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key -- Use the key fetched from Vault
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
    RAISE LOG 'AI parsing trigger called for artifact ID: %', NEW.id;
  END IF;
  
  RETURN NEW; -- Return the new row for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the trigger_ai_parsing function after an update on the artifacts table.
CREATE TRIGGER on_transcription_complete
  AFTER UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_parsing();

-- Configuration setting for the Edge Function URL.
ALTER DATABASE postgres SET app.edge_function_url = 'https://zepawphplcisievcdugz.supabase.co/functions/v1';

-- Note: The app.service_role_key is now fetched from Vault within the trigger function. 