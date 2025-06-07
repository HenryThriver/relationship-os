-- Fix parameter name in email AI processing trigger
-- Migration: 20250605010904_fix_email_trigger_param.sql

-- Update the trigger function to use correct parameter name
CREATE OR REPLACE FUNCTION public.trigger_email_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_url TEXT;
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
      RETURN NEW;
    END;

    IF service_key IS NULL THEN
      RAISE WARNING 'INTERNAL_SERVICE_ROLE_KEY not found in Vault. Skipping AI processing trigger for email artifact ID %.', NEW.id;
      RETURN NEW;
    END IF;

    -- Hardcode the Edge Function URL
    edge_function_url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact';

    -- Set ai_parsing_status to pending if not already set
    IF NEW.ai_parsing_status IS NULL THEN
      NEW.ai_parsing_status = 'pending';
    END IF;

    -- Trigger the parse-artifact Edge Function with correct parameter name
    RAISE LOG 'Attempting to trigger AI processing for email artifact ID: %', NEW.id;
    
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('artifactId', NEW.id)  -- Changed from 'artifact_id' to 'artifactId'
    );
    
    RAISE LOG 'AI processing trigger called for email artifact ID: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 