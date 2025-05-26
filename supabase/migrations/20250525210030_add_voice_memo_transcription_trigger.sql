-- supabase/migrations/20250525210030_add_voice_memo_transcription_trigger.sql

-- Ensure pg_net and vault extensions are enabled
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault; -- Or just "vault"

-- Helper function to retrieve decrypted secrets from Supabase Vault
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name TEXT)
RETURNS TEXT AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
    WHERE name = secret_name
    LIMIT 1;

    IF secret_value IS NULL THEN
        RAISE WARNING 'Secret not found in Vault: %', secret_name;
    END IF;

    RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execute on the helper function to postgres role (or role executing triggers)
GRANT EXECUTE ON FUNCTION public.get_decrypted_secret(TEXT) TO postgres;
-- If your triggers run as a different role, grant to that role instead.
-- Example: GRANT EXECUTE ON FUNCTION public.get_decrypted_secret(TEXT) TO supabase_admin_role_if_different;


-- Trigger function to invoke the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_voice_memo_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Or SECURITY INVOKER if get_decrypted_secret handles permissions appropriately
AS $$
DECLARE
  project_url TEXT := 'https://zepawphplcisievcdugz.supabase.co'; -- Your Supabase project URL
  service_key TEXT; 
  anon_key TEXT; -- For apikey header, can also be service key if Edge function expects that
  function_url TEXT := project_url || '/functions/v1/transcribe-voice-memo';
  payload JSONB;
BEGIN
  -- Retrieve keys from Vault. User must ensure these are set in Vault.
  service_key := public.get_decrypted_secret('INTERNAL_SERVICE_ROLE_KEY');
  -- For 'apikey' header, Supabase typically expects the anon key for client-facing calls,
  -- but for service-to-service calls protected by service_role, often the service_role key itself is used as apikey.
  -- Or, your Edge Function might not strictly require the 'apikey' header if 'Authorization' with service_role is present.
  -- Using service_key for apikey here for simplicity, adjust if your function expects anon_key.
  anon_key := public.get_decrypted_secret('SUPABASE_ANON_KEY'); -- User needs to store this in Vault too.

  IF service_key IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'Service role key or anon key not found in Vault. Transcription trigger will not run for artifact ID: %', NEW.id;
    RETURN NEW; -- Or OLD if TG_OP = 'DELETE'
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.type = 'voice_memo' AND NEW.transcription_status = 'pending') THEN
    payload := jsonb_build_object('record', row_to_json(NEW));

    PERFORM net.http_post(
        url := function_url,
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key,
            'apikey', anon_key -- Using anon_key for apikey header
        )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on INSERT to artifacts table
DROP TRIGGER IF EXISTS on_artifact_insert_for_voice_memo_transcription ON public.artifacts;
CREATE TRIGGER on_artifact_insert_for_voice_memo_transcription
  AFTER INSERT ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_voice_memo_transcription();

-- Optional: Trigger on UPDATE if you want to re-process or handle updates
-- For example, if a transcription failed and status is set back to 'pending' by a user
-- DROP TRIGGER IF EXISTS on_artifact_update_for_voice_memo_transcription ON public.artifacts;
-- CREATE TRIGGER on_artifact_update_for_voice_memo_transcription
--   AFTER UPDATE OF transcription_status ON public.artifacts
--   FOR EACH ROW
--   WHEN (OLD.transcription_status IS DISTINCT FROM NEW.transcription_status AND NEW.type = 'voice_memo' AND NEW.transcription_status = 'pending')
--   EXECUTE FUNCTION public.trigger_voice_memo_transcription(); 