-- Add AI processing support for meeting artifacts
-- Ensure ai_parsing_status field exists (it should from previous migrations)
-- Add default ai_parsing_status for meeting artifacts

-- Update existing meeting artifacts to have pending AI parsing status
UPDATE public.artifacts 
SET ai_parsing_status = 'pending'
WHERE type = 'meeting' 
  AND ai_parsing_status IS NULL;

-- Create function to trigger AI processing for meeting artifacts
CREATE OR REPLACE FUNCTION public.trigger_meeting_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
BEGIN
  -- Only process meeting artifacts
  IF NEW.type != 'meeting' THEN
    RETURN NEW;
  END IF;

  -- Only trigger if this is a new meeting or if ai_parsing_status was just set to pending
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND NEW.ai_parsing_status = 'pending')) THEN
    
    -- Retrieve the service role key from Supabase Vault
    BEGIN
      SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' LIMIT 1;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Could not retrieve INTERNAL_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
      service_key := NULL;
    END;

    IF service_key IS NULL THEN
      RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault. Skipping AI processing trigger for meeting artifact ID %.', NEW.id;
      RETURN NEW;
    END IF;

    -- Retrieve the Edge Function base URL
    BEGIN
      edge_function_base_url := current_setting('app.edge_function_url');
    EXCEPTION WHEN others THEN
      RAISE WARNING 'app.edge_function_url not set. Error: %', SQLERRM;
      edge_function_base_url := NULL;
    END;

    IF edge_function_base_url IS NULL OR edge_function_base_url = '' THEN
      RAISE WARNING 'app.edge_function_url is not configured. Skipping AI processing trigger for meeting artifact ID %.', NEW.id;
      RETURN NEW;
    END IF;

    -- Set ai_parsing_status to pending if not already set
    IF NEW.ai_parsing_status IS NULL THEN
      NEW.ai_parsing_status = 'pending';
    END IF;

    -- Trigger the parse-artifact Edge Function
    RAISE LOG 'Attempting to trigger AI processing for meeting artifact ID: %', NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-artifact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)
    );
    RAISE LOG 'AI processing trigger called for meeting artifact ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for meeting AI processing
DROP TRIGGER IF EXISTS on_meeting_artifact_created ON public.artifacts;
CREATE TRIGGER on_meeting_artifact_created
  BEFORE INSERT OR UPDATE ON public.artifacts
  FOR EACH ROW
  WHEN (NEW.type = 'meeting')
  EXECUTE FUNCTION public.trigger_meeting_ai_processing();

-- Process existing meeting artifacts that haven't been processed
-- This will trigger the AI processing for existing meetings
UPDATE public.artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NOW()
WHERE type = 'meeting' 
  AND (ai_parsing_status IS NULL OR ai_parsing_status = 'pending')
  AND content IS NOT NULL;

-- Update existing voice memo trigger to use the new parse-artifact function
-- This ensures both voice memos and meetings use the same processing pipeline
CREATE OR REPLACE FUNCTION public.trigger_ai_parsing()
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
    service_key := NULL;
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
    edge_function_base_url := NULL;
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
    
    RAISE LOG 'Attempting to trigger AI parsing for voice memo artifact ID: %', NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-artifact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)
    );
    RAISE LOG 'AI parsing trigger called for voice memo artifact ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 