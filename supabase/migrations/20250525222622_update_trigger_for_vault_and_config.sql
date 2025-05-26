-- supabase/migrations/20250525222622_update_trigger_for_vault_and_config.sql

-- Function to trigger AI parsing Edge Function (using Vault for service key and hardcoded URL)
CREATE OR REPLACE FUNCTION trigger_ai_parsing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  -- Hardcode the Edge Function base URL here for project zepawphplcisievcdugz
  edge_function_base_url TEXT := 'https://zepawphplcisievcdugz.supabase.co/functions/v1'; 
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

  -- Check if the updated row is a voice memo, transcription is completed,
  -- AI parsing is pending, and transcription content exists.
  IF NEW.type = 'voice_memo' 
     AND NEW.transcription_status = 'completed' 
     AND NEW.ai_parsing_status = 'pending' 
     AND NEW.transcription IS NOT NULL THEN
    
    RAISE LOG 'Attempting to trigger AI parsing for artifact ID: %', NEW.id;
    PERFORM net.http_post(
      url := edge_function_base_url || '/parse-voice-memo', -- Use the hardcoded URL
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
DROP TRIGGER IF EXISTS on_transcription_complete ON artifacts; -- Drop if exists to ensure it's re-added with the updated function
CREATE TRIGGER on_transcription_complete
  AFTER UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_parsing();

-- Note: The app.edge_function_url is now hardcoded in the trigger function.
-- Note: The app.service_role_key is fetched from Vault within the trigger function. 