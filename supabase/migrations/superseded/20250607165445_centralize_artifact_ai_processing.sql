-- Centralize all artifact AI processing into one unified, extensible trigger
-- This replaces the scattered trigger functions for emails, meetings, voice memos, and LinkedIn posts
-- Future artifact types will automatically be supported without additional trigger code

-- Drop all existing AI processing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_email_artifact_created ON public.artifacts;
DROP TRIGGER IF EXISTS on_meeting_artifact_created ON public.artifacts;
DROP TRIGGER IF EXISTS on_transcription_complete ON public.artifacts;
DROP TRIGGER IF EXISTS on_artifact_ai_processing ON public.artifacts;

-- Drop old trigger functions (keep the debug logging functions for reference)
DROP FUNCTION IF EXISTS public.trigger_email_ai_processing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_meeting_ai_processing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_ai_parsing() CASCADE;

-- Create a centralized, extensible artifact processing configuration table
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
  ('linkedin_post', true, false, false, '{"content", "author"}')
ON CONFLICT (artifact_type) DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  requires_content = EXCLUDED.requires_content,
  requires_transcription = EXCLUDED.requires_transcription,
  requires_metadata_fields = EXCLUDED.requires_metadata_fields,
  updated_at = NOW();

-- Create the unified, extensible AI processing trigger function
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
  SELECT * INTO config_row 
  FROM public.artifact_processing_config 
  WHERE artifact_type = NEW.type;

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

  -- Metadata field requirements (LinkedIn posts, future types)
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

  -- Retrieve service credentials
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

  -- Set edge function URL (hardcoded since we can't set database config in cloud)
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

-- Enable RLS on the config table
ALTER TABLE public.artifact_processing_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only service role can modify config
CREATE POLICY "Service role can manage artifact processing config" ON public.artifact_processing_config
  FOR ALL USING (auth.role() = 'service_role');

-- Grant usage to authenticated users for read access  
GRANT SELECT ON public.artifact_processing_config TO authenticated;
GRANT ALL ON public.artifact_processing_config TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.artifact_processing_config IS 'Configuration table for artifact AI processing. Add new artifact types here to enable automatic AI processing.';
COMMENT ON COLUMN public.artifact_processing_config.artifact_type IS 'The artifact type (must match artifacts.type enum values)';
COMMENT ON COLUMN public.artifact_processing_config.enabled IS 'Whether AI processing is enabled for this artifact type';
COMMENT ON COLUMN public.artifact_processing_config.requires_content IS 'Whether the artifact must have content before processing';
COMMENT ON COLUMN public.artifact_processing_config.requires_transcription IS 'Whether the artifact must have completed transcription before processing';
COMMENT ON COLUMN public.artifact_processing_config.requires_metadata_fields IS 'Array of metadata field names that must be present and non-empty';

COMMENT ON FUNCTION public.trigger_unified_artifact_ai_processing() IS 'Unified trigger function for all artifact AI processing. Automatically handles new artifact types based on artifact_processing_config table.';

-- Log the consolidation
SELECT 'Centralized artifact AI processing system deployed. All artifact types now use unified trigger.' as deployment_status; 