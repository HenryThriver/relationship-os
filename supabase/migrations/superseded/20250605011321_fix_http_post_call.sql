-- Fix net.http_post call with correct parameter types
-- Migration: 20250605011321_fix_http_post_call.sql

-- Update the trigger function with correct net.http_post signature
CREATE OR REPLACE FUNCTION public.trigger_email_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_url TEXT;
  request_id BIGINT;
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

    -- Trigger the parse-artifact Edge Function with correct signature
    RAISE LOG 'Attempting to trigger AI processing for email artifact ID: %', NEW.id;
    
    -- Use correct net.http_post signature: (url, body, params, headers)
    SELECT net.http_post(
      edge_function_url,
      jsonb_build_object('artifactId', NEW.id),  -- body as jsonb
      '{}'::jsonb,  -- params as jsonb (empty)
      jsonb_build_object('Authorization', 'Bearer ' || service_key)  -- headers as jsonb
    ) INTO request_id;
    
    RAISE LOG 'AI processing trigger called for email artifact ID: %, request_id: %', NEW.id, request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 