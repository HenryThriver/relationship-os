-- Add debugging to email AI processing trigger
-- Migration: 20250605011706_debug_email_trigger.sql

-- Create a simple debug table to track trigger calls
CREATE TABLE IF NOT EXISTS public.trigger_debug_log (
  id SERIAL PRIMARY KEY,
  trigger_name TEXT,
  artifact_id UUID,
  artifact_type TEXT,
  old_status TEXT,
  new_status TEXT,
  trigger_operation TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the trigger function with extensive debugging
CREATE OR REPLACE FUNCTION public.trigger_email_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_url TEXT;
  request_id BIGINT;
BEGIN
  -- Log that the trigger was called
  INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
  VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'Trigger function called');

  -- Only process email artifacts
  IF NEW.type != 'email' THEN
    INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
    VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'Skipping: not an email artifact');
    RETURN NEW;
  END IF;

  -- Log that it's an email artifact
  INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
  VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'Processing email artifact');

  -- Only trigger if this is a new email or if ai_parsing_status was just set to pending
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND NEW.ai_parsing_status = 'pending')) THEN
    
    INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
    VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'Trigger condition met, proceeding with HTTP call');
    
    -- Retrieve the service role key from Supabase Vault
    BEGIN
      SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY' LIMIT 1;
    EXCEPTION WHEN others THEN
      INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
      VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'ERROR: Could not retrieve service key: ' || SQLERRM);
      RETURN NEW;
    END;

    IF service_key IS NULL THEN
      INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
      VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'ERROR: Service key is NULL');
      RETURN NEW;
    END IF;

    -- Hardcode the Edge Function URL
    edge_function_url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact';

    -- Set ai_parsing_status to pending if not already set
    IF NEW.ai_parsing_status IS NULL THEN
      NEW.ai_parsing_status = 'pending';
    END IF;

    -- Trigger the parse-artifact Edge Function
    BEGIN
      SELECT net.http_post(
        edge_function_url,
        jsonb_build_object('artifactId', NEW.id),
        '{}'::jsonb,
        jsonb_build_object('Authorization', 'Bearer ' || service_key)
      ) INTO request_id;
      
      INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
      VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'SUCCESS: HTTP call made, request_id: ' || request_id);
    EXCEPTION WHEN others THEN
      INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
      VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'ERROR: HTTP call failed: ' || SQLERRM);
    END;
  ELSE
    INSERT INTO public.trigger_debug_log (trigger_name, artifact_id, artifact_type, old_status, new_status, trigger_operation, message)
    VALUES ('trigger_email_ai_processing', NEW.id, NEW.type, OLD.ai_parsing_status, NEW.ai_parsing_status, TG_OP, 'Trigger condition NOT met');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 