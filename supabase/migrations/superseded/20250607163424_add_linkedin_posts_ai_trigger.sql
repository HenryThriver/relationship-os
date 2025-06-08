-- Add AI processing triggers for LinkedIn posts and emails
-- This ensures that when new LinkedIn posts or emails are created with ai_parsing_status='pending',
-- they automatically trigger the AI parsing function for suggestions

-- Create or replace a comprehensive trigger function that handles all artifact types
CREATE OR REPLACE FUNCTION public.trigger_artifact_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
BEGIN
  -- Only process artifacts that need AI parsing
  IF NEW.ai_parsing_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Check if this is a type that should trigger AI processing
  IF NEW.type NOT IN ('voice_memo', 'meeting', 'email', 'linkedin_post') THEN
    RETURN NEW;
  END IF;

  -- Special handling for voice memos - only trigger when transcription is complete
  IF NEW.type = 'voice_memo' AND (NEW.transcription_status != 'completed' OR NEW.transcription IS NULL) THEN
    RETURN NEW;
  END IF;

  -- Special handling for meetings - only trigger when content exists
  IF NEW.type = 'meeting' AND NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  -- Special handling for emails - only trigger when content exists
  IF NEW.type = 'email' AND NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  -- Special handling for LinkedIn posts - only trigger when metadata exists
  IF NEW.type = 'linkedin_post' AND (NEW.metadata IS NULL OR NEW.metadata->>'content' IS NULL) THEN
    RETURN NEW;
  END IF;

  -- Only trigger on INSERT or when ai_parsing_status changes to 'pending'
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND NEW.ai_parsing_status = 'pending') THEN
    
    -- Retrieve the service role key from Supabase Vault
    BEGIN
      SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' LIMIT 1;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Could not retrieve INTERNAL_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
      service_key := NULL;
    END;

    IF service_key IS NULL THEN
      RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault. Skipping AI processing trigger for % artifact ID %.', NEW.type, NEW.id;
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
      RAISE WARNING 'app.edge_function_url is not configured. Skipping AI processing trigger for % artifact ID %.', NEW.type, NEW.id;
      RETURN NEW;
    END IF;

    -- Trigger the parse-artifact Edge Function
    RAISE LOG 'Attempting to trigger AI processing for % artifact ID: %', NEW.type, NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-artifact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)
    );
    RAISE LOG 'AI processing trigger called for % artifact ID: %', NEW.type, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to replace with the comprehensive one
DROP TRIGGER IF EXISTS on_transcription_complete ON public.artifacts;
DROP TRIGGER IF EXISTS on_meeting_artifact_created ON public.artifacts;

-- Create the comprehensive trigger that handles all artifact types
CREATE TRIGGER on_artifact_ai_processing
  AFTER INSERT OR UPDATE ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_artifact_ai_processing();

-- Process existing LinkedIn posts that haven't been processed yet
-- This will trigger AI processing for existing LinkedIn posts with pending status
UPDATE public.artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NOW()
WHERE type = 'linkedin_post' 
  AND (ai_parsing_status IS NULL OR ai_parsing_status = 'pending')
  AND metadata IS NOT NULL
  AND metadata->>'content' IS NOT NULL;

-- Process existing emails that haven't been processed yet
UPDATE public.artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NOW()
WHERE type = 'email' 
  AND (ai_parsing_status IS NULL OR ai_parsing_status = 'pending')
  AND content IS NOT NULL; 