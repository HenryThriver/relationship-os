-- Add AI processing support for email artifacts
-- Migration: 20250605005455_add_email_ai_processing.sql

-- Update existing email artifacts to have pending AI parsing status
UPDATE public.artifacts 
SET ai_parsing_status = 'pending'
WHERE type = 'email' 
  AND ai_parsing_status IS NULL;

-- Create function to trigger AI processing for email artifacts
CREATE OR REPLACE FUNCTION public.trigger_email_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
BEGIN
  -- Only process email artifacts
  IF NEW.type != 'email' THEN
    RETURN NEW;
  END IF;

  -- Only trigger if this is a new email or if ai_parsing_status was just set to pending
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND NEW.ai_parsing_status = 'pending')) THEN
    
    -- Retrieve the service role key from Supabase Vault
    BEGIN
      SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' LIMIT 1;
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Could not retrieve INTERNAL_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
      service_key := NULL;
    END;

    IF service_key IS NULL THEN
      RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault. Skipping AI processing trigger for email artifact ID %.', NEW.id;
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
      RAISE WARNING 'app.edge_function_url is not configured. Skipping AI processing trigger for email artifact ID %.', NEW.id;
      RETURN NEW;
    END IF;

    -- Set ai_parsing_status to pending if not already set
    IF NEW.ai_parsing_status IS NULL THEN
      NEW.ai_parsing_status = 'pending';
    END IF;

    -- Trigger the parse-artifact Edge Function
    RAISE LOG 'Attempting to trigger AI processing for email artifact ID: %', NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-artifact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)
    );
    RAISE LOG 'AI processing trigger called for email artifact ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email AI processing
DROP TRIGGER IF EXISTS on_email_artifact_created ON public.artifacts;
CREATE TRIGGER on_email_artifact_created
  BEFORE INSERT OR UPDATE ON public.artifacts
  FOR EACH ROW
  WHEN (NEW.type = 'email')
  EXECUTE FUNCTION public.trigger_email_ai_processing();

-- Process existing email artifacts that haven't been processed
-- This will trigger the AI processing for existing emails
UPDATE public.artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NOW()
WHERE type = 'email' 
  AND (ai_parsing_status IS NULL OR ai_parsing_status = 'pending')
  AND content IS NOT NULL; 