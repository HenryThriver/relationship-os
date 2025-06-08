-- LinkedIn Posts AI Integration - Consolidated Migration
-- This migration adds comprehensive LinkedIn posts sync and AI processing capabilities
-- Consolidates all related changes from the LinkedIn Posts AI integration session

-- =============================================================================
-- 1. LINKEDIN POSTS SYNC TRACKING
-- =============================================================================

-- Add LinkedIn posts sync tracking to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS linkedin_posts_last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS linkedin_posts_sync_status TEXT DEFAULT 'never';

-- Add indexes for sync status and timing queries
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_sync_status ON public.contacts(linkedin_posts_sync_status);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_last_sync ON public.contacts(linkedin_posts_last_sync_at);

-- Add comments
COMMENT ON COLUMN public.contacts.linkedin_posts_last_sync_at IS 'Timestamp of last LinkedIn posts sync for this contact';
COMMENT ON COLUMN public.contacts.linkedin_posts_sync_status IS 'Status of LinkedIn posts sync: never, in_progress, completed, failed';

-- =============================================================================
-- 2. LINKEDIN POST DUPLICATE PREVENTION
-- =============================================================================

-- Create unique index to prevent LinkedIn post duplicates
-- This ensures that even if multiple sync requests happen, we can't insert duplicate posts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_linkedin_posts 
ON artifacts (contact_id, user_id, (metadata->>'post_id'))
WHERE type = 'linkedin_post' AND metadata->>'post_id' IS NOT NULL;

COMMENT ON INDEX idx_unique_linkedin_posts IS 'Ensures LinkedIn posts are unique per contact per user based on post_id from metadata';

-- =============================================================================
-- 3. CENTRALIZED ARTIFACT AI PROCESSING SYSTEM
-- =============================================================================

-- Drop all existing AI processing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_email_artifact_created ON public.artifacts;
DROP TRIGGER IF EXISTS on_meeting_artifact_created ON public.artifacts;
DROP TRIGGER IF EXISTS on_transcription_complete ON public.artifacts;
DROP TRIGGER IF EXISTS on_artifact_ai_processing ON public.artifacts;
DROP TRIGGER IF EXISTS on_unified_artifact_ai_processing ON public.artifacts;

-- Drop old trigger functions
DROP FUNCTION IF EXISTS public.trigger_email_ai_processing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_meeting_ai_processing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_ai_parsing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_artifact_ai_processing() CASCADE;

-- Create centralized artifact processing configuration table
CREATE TABLE IF NOT EXISTS public.artifact_processing_config (
  artifact_type TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  requires_content BOOLEAN DEFAULT false,
  requires_transcription BOOLEAN DEFAULT false,
  requires_metadata_fields TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert processing rules for all current artifact types
INSERT INTO public.artifact_processing_config (artifact_type, enabled, requires_content, requires_transcription, requires_metadata_fields)
VALUES 
  ('voice_memo', true, false, true, '{}'),
  ('meeting', true, true, false, '{}'),
  ('email', true, true, false, '{}'),
  ('linkedin_post', true, false, false, '{"content", "author"}'),
  ('linkedin_profile', true, false, false, '{"about", "headline"}')
ON CONFLICT (artifact_type) DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  requires_content = EXCLUDED.requires_content,
  requires_transcription = EXCLUDED.requires_transcription,
  requires_metadata_fields = EXCLUDED.requires_metadata_fields,
  updated_at = NOW();

-- =============================================================================
-- 4. UNIFIED AI PROCESSING TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_unified_artifact_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
  config_row public.artifact_processing_config%ROWTYPE;
  field_name TEXT;
  metadata_value TEXT;
  ready_for_processing BOOLEAN := true;
BEGIN
  -- Only process artifacts with pending AI parsing status
  IF NEW.ai_parsing_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Only trigger on INSERT or when ai_parsing_status changes to 'pending'
  IF NOT (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND NEW.ai_parsing_status = 'pending')) THEN
    RETURN NEW;
  END IF;

  -- Get processing configuration for this artifact type
  -- Cast enum to text for comparison to avoid type mismatch
  SELECT * INTO config_row 
  FROM public.artifact_processing_config 
  WHERE artifact_type = NEW.type::TEXT;

  -- If no config found or disabled, skip processing
  IF config_row IS NULL OR NOT config_row.enabled THEN
    RAISE LOG 'Skipping AI processing for % artifact ID %: No config or disabled', NEW.type, NEW.id;
    RETURN NEW;
  END IF;

  -- Check artifact-specific readiness conditions
  
  -- Voice memo: requires completed transcription
  IF config_row.requires_transcription AND (NEW.transcription_status != 'completed' OR NEW.transcription IS NULL) THEN
    RAISE LOG 'Skipping AI processing for % artifact ID %: Transcription not ready', NEW.type, NEW.id;
    ready_for_processing := false;
  END IF;

  -- Content requirement (meetings, emails)
  IF config_row.requires_content AND NEW.content IS NULL THEN
    RAISE LOG 'Skipping AI processing for % artifact ID %: Content not available', NEW.type, NEW.id;
    ready_for_processing := false;
  END IF;

  -- Metadata field requirements (LinkedIn posts, LinkedIn profiles, future types)
  IF array_length(config_row.requires_metadata_fields, 1) > 0 THEN
    IF NEW.metadata IS NULL THEN
      RAISE LOG 'Skipping AI processing for % artifact ID %: Metadata not available', NEW.type, NEW.id;
      ready_for_processing := false;
    ELSE
      -- Check each required metadata field
      FOREACH field_name IN ARRAY config_row.requires_metadata_fields
      LOOP
        metadata_value := NEW.metadata->>field_name;
        IF metadata_value IS NULL OR metadata_value = '' THEN
          RAISE LOG 'Skipping AI processing for % artifact ID %: Required metadata field % missing', NEW.type, NEW.id, field_name;
          ready_for_processing := false;
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- If not ready, exit early
  IF NOT ready_for_processing THEN
    RETURN NEW;
  END IF;

  -- Retrieve service credentials from Vault
  BEGIN
    SELECT decrypted_secret INTO service_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' 
    LIMIT 1;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Could not retrieve INTERNAL_SERVICE_ROLE_KEY from Vault for % artifact ID %: %', NEW.type, NEW.id, SQLERRM;
    RETURN NEW;
  END;

  IF service_key IS NULL THEN
    RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault for % artifact ID %', NEW.type, NEW.id;
    RETURN NEW;
  END IF;

  -- Set edge function URL (hardcoded for cloud Supabase project)
  edge_function_base_url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1';

  -- Trigger the unified parse-artifact Edge Function
  BEGIN
    RAISE LOG 'Triggering unified AI processing for % artifact ID %', NEW.type, NEW.id;
    
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-artifact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)
    );
    
    RAISE LOG 'Successfully triggered unified AI processing for % artifact ID %', NEW.type, NEW.id;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Failed to trigger AI processing for % artifact ID %: %', NEW.type, NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the unified trigger
CREATE TRIGGER on_unified_artifact_ai_processing
  AFTER INSERT OR UPDATE ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_unified_artifact_ai_processing();

-- =============================================================================
-- 5. PERMISSIONS AND SECURITY
-- =============================================================================

-- Enable RLS on the config table
ALTER TABLE public.artifact_processing_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only service role can modify config
CREATE POLICY "Service role can manage artifact processing config" ON public.artifact_processing_config
  FOR ALL USING (auth.role() = 'service_role');

-- Grant appropriate permissions
GRANT SELECT ON public.artifact_processing_config TO authenticated;
GRANT ALL ON public.artifact_processing_config TO service_role;

-- =============================================================================
-- 6. DOCUMENTATION AND COMMENTS
-- =============================================================================

COMMENT ON TABLE public.artifact_processing_config IS 'Configuration table for artifact AI processing. Add new artifact types here to enable automatic AI processing.';
COMMENT ON COLUMN public.artifact_processing_config.artifact_type IS 'The artifact type (must match artifacts.type enum values)';
COMMENT ON COLUMN public.artifact_processing_config.enabled IS 'Whether AI processing is enabled for this artifact type';
COMMENT ON COLUMN public.artifact_processing_config.requires_content IS 'Whether the artifact must have content before processing';
COMMENT ON COLUMN public.artifact_processing_config.requires_transcription IS 'Whether the artifact must have completed transcription before processing';
COMMENT ON COLUMN public.artifact_processing_config.requires_metadata_fields IS 'Array of metadata field names that must be present and non-empty';

COMMENT ON FUNCTION public.trigger_unified_artifact_ai_processing() IS 'Unified trigger function for all artifact AI processing. Automatically handles new artifact types based on artifact_processing_config table.';

-- =============================================================================
-- 7. MIGRATION COMPLETION LOG
-- =============================================================================

SELECT 
  'LinkedIn Posts AI Integration consolidated migration completed successfully' as status,
  NOW() as completed_at,
  'Features: LinkedIn sync tracking, duplicate prevention, centralized AI processing, LinkedIn profile support' as features; 