-- Fix the artifact type enum comparison issue in unified AI processing trigger
-- The error occurs because we're comparing TEXT (artifact_type) with artifact_type_enum (NEW.type)
-- PostgreSQL requires explicit casting for this comparison

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
  -- FIXED: Cast enum to text for comparison
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

-- Log the fix
SELECT 'Fixed artifact type enum comparison in unified AI processing trigger' as fix_status; 