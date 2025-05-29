

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."artifact_type_enum" AS ENUM (
    'note',
    'email',
    'call',
    'meeting',
    'linkedin_message',
    'linkedin_post',
    'file',
    'other',
    'linkedin_profile',
    'pog',
    'ask',
    'milestone',
    'voice_memo',
    'loop'
);


ALTER TYPE "public"."artifact_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_decrypted_secret"("secret_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_decrypted_secret"("secret_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_integration"("p_user_id" "uuid", "p_integration_type" "text") RETURNS TABLE("id" "uuid", "access_token" "text", "refresh_token" "text", "token_expires_at" timestamp with time zone, "scopes" "text"[], "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.access_token,
        ui.refresh_token,
        ui.token_expires_at,
        ui.scopes,
        ui.metadata
    FROM public.user_integrations ui
    WHERE ui.user_id = p_user_id 
    AND ui.integration_type = p_integration_type
    AND ui.access_token IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_user_integration"("p_user_id" "uuid", "p_integration_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_artifact_ai_processing_start"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This trigger sets the start time when a voice memo is inserted
  -- or when its ai_parsing_status is explicitly updated to 'processing'.
  -- The edge function might be a more precise place to set this if the actual start
  -- of processing is decoupled from these specific database events.

  IF (TG_OP = 'INSERT' AND NEW.type = 'voice_memo' AND NEW.ai_processing_started_at IS NULL) THEN
    -- Potentially set on insert if processing is meant to start immediately
    -- NEW.ai_processing_started_at = NOW(); 
    -- However, usually an edge function picks it up, so the edge function should set this.
    -- For now, we'll rely on an explicit update or the edge function setting it.
  END IF;

  IF (TG_OP = 'UPDATE' AND NEW.type = 'voice_memo') THEN
    -- If ai_parsing_status transitions to 'processing' and start time isn't set
    IF (OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND 
        NEW.ai_parsing_status = 'processing' AND 
        NEW.ai_processing_started_at IS NULL) THEN
      NEW.ai_processing_started_at = NOW();
    END IF;

    -- If reprocess is triggered, explicitly set ai_processing_started_at and clear completed_at
    -- This assumes a reprocess action might nullify ai_parsing_status or set it to 'pending'/'processing'
    -- and also nullify ai_processing_completed_at before this trigger fires.
    -- The API route for reprocessing should set ai_processing_started_at = NOW() and ai_processing_completed_at = NULL.
    -- This trigger might be redundant if API does it, but can serve as a fallback.
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_artifact_ai_processing_start"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_email_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If deleting primary email, clear contact.email
    IF OLD.is_primary = true THEN
        UPDATE contacts 
        SET email = NULL, updated_at = NOW()
        WHERE id = OLD.contact_id AND email = OLD.email;
    END IF;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_email_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id);
END;
$$;


ALTER FUNCTION "public"."is_valid_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_primary_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If setting a new primary email
    IF NEW.is_primary = true THEN
        -- Update the contact's main email field
        UPDATE contacts 
        SET email = NEW.email, updated_at = NOW()
        WHERE id = NEW.contact_id;
        
        -- Unset other primary emails for this contact
        UPDATE contact_emails 
        SET is_primary = false, updated_at = NOW()
        WHERE contact_id = NEW.contact_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
    
    -- If removing primary status, clear contact.email if it matches
    IF OLD.is_primary = true AND NEW.is_primary = false THEN
        UPDATE contacts 
        SET email = NULL, updated_at = NOW()
        WHERE id = NEW.contact_id AND email = OLD.email;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_primary_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_ai_parsing"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_ai_parsing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contact_calendar_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    contact_owner_id UUID;
BEGIN
    -- Get the user who owns this contact (using user_id, not created_by)
    SELECT user_id INTO contact_owner_id
    FROM public.contacts 
    WHERE id = NEW.contact_id;

    -- If we can't find the contact owner, log and exit
    IF contact_owner_id IS NULL THEN
        RAISE WARNING 'Could not find owner for contact_id: %', NEW.contact_id;
        RETURN NEW;
    END IF;

    -- Insert a sync job for this contact (with conflict handling for unique constraint)
    INSERT INTO public.contact_specific_sync_jobs (
        contact_id,
        user_id,
        sync_options,
        metadata
    )
    VALUES (
        NEW.contact_id,
        contact_owner_id,
        jsonb_build_object(
            'lookbackDays', 180,    -- 6 months back for comprehensive history
            'lookforwardDays', 60,   -- 2 months forward for upcoming meetings
            'trigger', 'email_added',
            'newEmail', NEW.email
        ),
        jsonb_build_object(
            'triggered_by_email_id', NEW.id,
            'email_address', NEW.email,
            'email_type', NEW.email_type,
            'is_primary', NEW.is_primary,
            'triggered_at', NOW()
        )
    )
    ON CONFLICT (contact_id, status) DO UPDATE SET
        -- If there's already a pending job for this contact, update it with the new email info
        sync_options = jsonb_set(
            contact_specific_sync_jobs.sync_options,
            '{newEmail}',
            to_jsonb(NEW.email)
        ),
        metadata = jsonb_set(
            contact_specific_sync_jobs.metadata,
            '{latest_email_added}',
            to_jsonb(NEW.email)
        ),
        created_at = NOW()
    WHERE contact_specific_sync_jobs.status = 'pending';

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the original email insert
        RAISE WARNING 'Error creating calendar sync job for contact %: %', NEW.contact_id, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contact_calendar_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_meeting_ai_processing"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_meeting_ai_processing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_voice_memo_transcription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."trigger_voice_memo_transcription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_integration"("p_user_id" "uuid", "p_integration_type" "text", "p_access_token" "text", "p_refresh_token" "text" DEFAULT NULL::"text", "p_token_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_scopes" "text"[] DEFAULT NULL::"text"[], "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    integration_id UUID;
BEGIN
    INSERT INTO public.user_integrations (
        user_id,
        integration_type,
        access_token,
        refresh_token,
        token_expires_at,
        scopes,
        metadata
    )
    VALUES (
        p_user_id,
        p_integration_type,
        p_access_token,
        p_refresh_token,
        p_token_expires_at,
        p_scopes,
        p_metadata
    )
    ON CONFLICT (user_id, integration_type)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO integration_id;
    
    RETURN integration_id;
END;
$$;


ALTER FUNCTION "public"."upsert_user_integration"("p_user_id" "uuid", "p_integration_type" "text", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone, "p_scopes" "text"[], "p_metadata" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."artifact_type_enum" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "impact_score" integer,
    "reciprocity_weight" numeric(3,2) DEFAULT 1.00,
    "loop_status" character varying(20) DEFAULT 'queued'::character varying,
    "initiator_user_id" "uuid",
    "initiator_contact_id" "uuid",
    "recipient_user_id" "uuid",
    "recipient_contact_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audio_file_path" "text",
    "transcription" "text",
    "duration_seconds" integer,
    "transcription_status" character varying(20) DEFAULT 'pending'::character varying,
    "ai_parsing_status" character varying(20) DEFAULT 'pending'::character varying,
    "ai_processing_started_at" timestamp with time zone,
    "ai_processing_completed_at" timestamp with time zone,
    CONSTRAINT "artifacts_impact_score_check" CHECK ((("impact_score" >= 1) AND ("impact_score" <= 5))),
    CONSTRAINT "artifacts_loop_status_check" CHECK ((("loop_status")::"text" = ANY ((ARRAY['queued'::character varying, 'active'::character varying, 'pending'::character varying, 'closed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "check_ai_parsing_status" CHECK ((("ai_parsing_status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'skipped'::character varying])::"text"[]))),
    CONSTRAINT "check_transcription_status" CHECK ((("transcription_status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[]))),
    CONSTRAINT "initiator_not_both_user_and_contact" CHECK ((NOT (("initiator_user_id" IS NOT NULL) AND ("initiator_contact_id" IS NOT NULL)))),
    CONSTRAINT "recipient_not_both_user_and_contact" CHECK ((NOT (("recipient_user_id" IS NOT NULL) AND ("recipient_contact_id" IS NOT NULL))))
);


ALTER TABLE "public"."artifacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."artifacts" IS 'Stores various types of interactions and data points related to contacts.';



COMMENT ON COLUMN "public"."artifacts"."contact_id" IS 'Foreign key to the contact this artifact belongs to.';



COMMENT ON COLUMN "public"."artifacts"."user_id" IS 'The user who owns this artifact (should match the contact''s owner).';



COMMENT ON COLUMN "public"."artifacts"."type" IS 'The type of artifact (e.g., note, email).';



COMMENT ON COLUMN "public"."artifacts"."timestamp" IS 'Timestamp of when the actual event/artifact occurred.';



COMMENT ON COLUMN "public"."artifacts"."created_at" IS 'Timestamp of when the artifact record was created in the database.';



COMMENT ON COLUMN "public"."artifacts"."impact_score" IS 'User-rated impact/value of the loop (1-5).';



COMMENT ON COLUMN "public"."artifacts"."reciprocity_weight" IS 'Multiplier for the loop''s value in reciprocity calculations (e.g., major favor = 2.0).';



COMMENT ON COLUMN "public"."artifacts"."loop_status" IS 'Tracks the state of a POG, Ask, or other actionable loop.';



COMMENT ON COLUMN "public"."artifacts"."initiator_user_id" IS 'User (from auth.users) who initiated the loop.';



COMMENT ON COLUMN "public"."artifacts"."initiator_contact_id" IS 'Contact (from contacts table) who initiated the loop.';



COMMENT ON COLUMN "public"."artifacts"."recipient_user_id" IS 'User (from auth.users) who is the recipient of the loop.';



COMMENT ON COLUMN "public"."artifacts"."recipient_contact_id" IS 'Contact (from contacts table) who is the recipient of the loop.';



COMMENT ON COLUMN "public"."artifacts"."updated_at" IS 'Timestamp of when the artifact record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."calendar_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sync_started_at" timestamp with time zone DEFAULT "now"(),
    "sync_completed_at" timestamp with time zone,
    "events_processed" integer DEFAULT 0,
    "artifacts_created" integer DEFAULT 0,
    "contacts_updated" "uuid"[] DEFAULT '{}'::"uuid"[],
    "errors" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'in_progress'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "calendar_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."calendar_sync_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."calendar_sync_logs" IS 'Tracks calendar synchronization operations and their results';



COMMENT ON COLUMN "public"."calendar_sync_logs"."contacts_updated" IS 'Array of contact UUIDs that were updated during this sync';



COMMENT ON COLUMN "public"."calendar_sync_logs"."errors" IS 'Array of error objects encountered during sync';



CREATE TABLE IF NOT EXISTS "public"."contact_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "email_type" "text" DEFAULT 'other'::"text",
    "is_primary" boolean DEFAULT false,
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_emails_email_type_check" CHECK (("email_type" = ANY (ARRAY['primary'::"text", 'work'::"text", 'personal'::"text", 'other'::"text"]))),
    CONSTRAINT "valid_email" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);


ALTER TABLE "public"."contact_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_specific_sync_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sync_options" "jsonb" DEFAULT "jsonb_build_object"('lookbackDays', 180, 'lookforwardDays', 60, 'trigger', 'email_added') NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "contact_specific_sync_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."contact_specific_sync_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_specific_sync_jobs" IS 'Queue for contact-specific calendar sync jobs triggered by email additions';



COMMENT ON COLUMN "public"."contact_specific_sync_jobs"."sync_options" IS 'JSON options for the sync including date ranges and trigger type';



COMMENT ON COLUMN "public"."contact_specific_sync_jobs"."metadata" IS 'Additional metadata about the job including trigger details';



CREATE TABLE IF NOT EXISTS "public"."contact_update_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artifact_id" "uuid",
    "contact_id" "uuid",
    "user_id" "uuid",
    "suggested_updates" "jsonb" NOT NULL,
    "field_paths" "text"[] NOT NULL,
    "confidence_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "user_selections" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "applied_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "priority" character varying(10) DEFAULT 'medium'::character varying,
    "dismissed_at" timestamp with time zone,
    CONSTRAINT "check_suggestion_priority" CHECK ((("priority")::"text" = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::"text"[]))),
    CONSTRAINT "check_suggestion_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'partial'::character varying, 'skipped'::character varying])::"text"[])))
);


ALTER TABLE "public"."contact_update_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "email" "text",
    "company" "text",
    "title" "text",
    "linkedin_url" "text" NOT NULL,
    "location" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "relationship_score" smallint,
    "last_interaction_date" timestamp with time zone,
    "professional_context" "jsonb" DEFAULT '{}'::"jsonb",
    "personal_context" "jsonb" DEFAULT '{}'::"jsonb",
    "linkedin_data" "jsonb" DEFAULT '{}'::"jsonb",
    "connection_cadence_days" integer DEFAULT 42,
    "field_sources" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "check_relationship_score" CHECK ((("relationship_score" >= 0) AND ("relationship_score" <= 6)))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Stores contact information for users.';



COMMENT ON COLUMN "public"."contacts"."user_id" IS 'The user who created and owns this contact.';



COMMENT ON COLUMN "public"."contacts"."linkedin_url" IS 'LinkedIn profile URL, intended to be unique.';



COMMENT ON COLUMN "public"."contacts"."relationship_score" IS 'Relationship Quality score, e.g., 1-6';



COMMENT ON COLUMN "public"."contacts"."last_interaction_date" IS 'Timestamp of the last recorded interaction with the contact';



COMMENT ON COLUMN "public"."contacts"."field_sources" IS 'Stores a mapping of contact field paths to the artifact ID that sourced the data for that field.';



CREATE TABLE IF NOT EXISTS "public"."loop_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "loop_artifact_id" "uuid" NOT NULL,
    "loop_type" "text" NOT NULL,
    "status_transitions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "completion_time_days" integer,
    "success_score" numeric(3,2),
    "reciprocity_impact" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."loop_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loop_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "source_artifact_id" "uuid" NOT NULL,
    "suggestion_data" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_loop_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "loop_suggestions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'auto_created'::"text"])))
);


ALTER TABLE "public"."loop_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loop_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "loop_type" "text" NOT NULL,
    "description" "text",
    "default_actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "typical_duration" integer,
    "follow_up_schedule" integer[],
    "completion_criteria" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "default_title_template" "text",
    "default_status" "text" DEFAULT 'idea'::"text" NOT NULL,
    "reciprocity_direction" "text" DEFAULT 'giving'::"text" NOT NULL,
    CONSTRAINT "check_loop_template_reciprocity" CHECK (("reciprocity_direction" = ANY (ARRAY['giving'::"text", 'receiving'::"text"]))),
    CONSTRAINT "check_loop_template_status" CHECK (("default_status" = ANY (ARRAY['idea'::"text", 'queued'::"text", 'offered'::"text", 'received'::"text", 'accepted'::"text", 'in_progress'::"text", 'delivered'::"text", 'completed'::"text", 'cancelled'::"text", 'on_hold'::"text", 'delegated'::"text", 'following_up'::"text"])))
);


ALTER TABLE "public"."loop_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."next_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "user_id" "uuid",
    "connection_type" character varying(50) NOT NULL,
    "scheduled_date" timestamp with time zone,
    "location" "text",
    "agenda" "jsonb" DEFAULT '{}'::"jsonb",
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."next_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "integration_type" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_integrations" IS 'Stores OAuth tokens and metadata for external service integrations like Google Calendar';



COMMENT ON COLUMN "public"."user_integrations"."integration_type" IS 'Type of integration (e.g., google_calendar, outlook, etc.)';



COMMENT ON COLUMN "public"."user_integrations"."scopes" IS 'Array of OAuth scopes granted for this integration';



COMMENT ON COLUMN "public"."user_integrations"."metadata" IS 'Additional integration-specific metadata';



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_sync_logs"
    ADD CONSTRAINT "calendar_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_emails"
    ADD CONSTRAINT "contact_emails_contact_id_email_key" UNIQUE ("contact_id", "email");



ALTER TABLE ONLY "public"."contact_emails"
    ADD CONSTRAINT "contact_emails_contact_id_excl" EXCLUDE USING "btree" ("contact_id" WITH =) WHERE (("is_primary" = true));



ALTER TABLE ONLY "public"."contact_emails"
    ADD CONSTRAINT "contact_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_specific_sync_jobs"
    ADD CONSTRAINT "contact_specific_sync_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_update_suggestions"
    ADD CONSTRAINT "contact_update_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_linkedin_url_key" UNIQUE ("linkedin_url");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loop_analytics"
    ADD CONSTRAINT "loop_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loop_suggestions"
    ADD CONSTRAINT "loop_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loop_templates"
    ADD CONSTRAINT "loop_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."next_connections"
    ADD CONSTRAINT "next_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_integration_type_key" UNIQUE ("user_id", "integration_type");



CREATE INDEX "idx_artifacts_initiator_contact" ON "public"."artifacts" USING "btree" ("initiator_contact_id");



CREATE INDEX "idx_artifacts_initiator_user" ON "public"."artifacts" USING "btree" ("initiator_user_id");



CREATE INDEX "idx_artifacts_loop_status" ON "public"."artifacts" USING "btree" ("loop_status");



CREATE INDEX "idx_artifacts_recipient_contact" ON "public"."artifacts" USING "btree" ("recipient_contact_id");



CREATE INDEX "idx_artifacts_recipient_user" ON "public"."artifacts" USING "btree" ("recipient_user_id");



CREATE INDEX "idx_artifacts_transcription" ON "public"."artifacts" USING "gin" ("to_tsvector"('"english"'::"regconfig", "transcription"));



CREATE INDEX "idx_contact_emails_contact_id" ON "public"."contact_emails" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_emails_email" ON "public"."contact_emails" USING "btree" ("email");



CREATE INDEX "idx_contact_emails_primary" ON "public"."contact_emails" USING "btree" ("contact_id", "is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_contact_sync_jobs_contact_id" ON "public"."contact_specific_sync_jobs" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_sync_jobs_created_at" ON "public"."contact_specific_sync_jobs" USING "btree" ("created_at");



CREATE INDEX "idx_contact_sync_jobs_status" ON "public"."contact_specific_sync_jobs" USING "btree" ("status");



CREATE INDEX "idx_contact_sync_jobs_user_id" ON "public"."contact_specific_sync_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_contacts_field_sources" ON "public"."contacts" USING "gin" ("field_sources");



CREATE INDEX "idx_contacts_linkedin_data" ON "public"."contacts" USING "gin" ("linkedin_data");



CREATE INDEX "idx_contacts_personal_context" ON "public"."contacts" USING "gin" ("personal_context");



CREATE INDEX "idx_contacts_professional_context" ON "public"."contacts" USING "gin" ("professional_context");



CREATE INDEX "idx_loop_analytics_completion" ON "public"."loop_analytics" USING "btree" ("completion_time_days", "success_score");



CREATE INDEX "idx_loop_analytics_user_contact" ON "public"."loop_analytics" USING "btree" ("user_id", "contact_id");



CREATE INDEX "idx_loop_suggestions_status" ON "public"."loop_suggestions" USING "btree" ("status", "created_at");



CREATE INDEX "idx_loop_suggestions_user_contact" ON "public"."loop_suggestions" USING "btree" ("user_id", "contact_id");



CREATE INDEX "idx_loop_templates_user_type" ON "public"."loop_templates" USING "btree" ("user_id", "loop_type");



CREATE INDEX "idx_next_connections_contact_id" ON "public"."next_connections" USING "btree" ("contact_id");



CREATE INDEX "idx_next_connections_scheduled_date" ON "public"."next_connections" USING "btree" ("scheduled_date");



CREATE INDEX "idx_next_connections_user_id" ON "public"."next_connections" USING "btree" ("user_id");



CREATE INDEX "idx_suggestions_artifact" ON "public"."contact_update_suggestions" USING "btree" ("artifact_id");



CREATE INDEX "idx_suggestions_contact" ON "public"."contact_update_suggestions" USING "btree" ("contact_id");



CREATE INDEX "idx_suggestions_dismissed" ON "public"."contact_update_suggestions" USING "btree" ("dismissed_at");



CREATE INDEX "idx_suggestions_priority" ON "public"."contact_update_suggestions" USING "btree" ("priority");



CREATE INDEX "idx_suggestions_status" ON "public"."contact_update_suggestions" USING "btree" ("status");



CREATE INDEX "idx_suggestions_viewed" ON "public"."contact_update_suggestions" USING "btree" ("viewed_at");



CREATE UNIQUE INDEX "idx_unique_pending_contact_job" ON "public"."contact_specific_sync_jobs" USING "btree" ("contact_id") WHERE ("status" = 'pending'::"text");



CREATE OR REPLACE TRIGGER "contact_email_added_sync_trigger" AFTER INSERT ON "public"."contact_emails" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_contact_calendar_sync"();



CREATE OR REPLACE TRIGGER "handle_email_deletion_trigger" AFTER DELETE ON "public"."contact_emails" FOR EACH ROW EXECUTE FUNCTION "public"."handle_email_deletion"();



CREATE OR REPLACE TRIGGER "handle_next_connections_updated_at" BEFORE UPDATE ON "public"."next_connections" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_artifact_insert_for_voice_memo_transcription" AFTER INSERT ON "public"."artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_voice_memo_transcription"();



CREATE OR REPLACE TRIGGER "on_artifacts_updated" BEFORE UPDATE ON "public"."artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_contacts_updated" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_meeting_artifact_created" BEFORE INSERT OR UPDATE ON "public"."artifacts" FOR EACH ROW WHEN (("new"."type" = 'meeting'::"public"."artifact_type_enum")) EXECUTE FUNCTION "public"."trigger_meeting_ai_processing"();



CREATE OR REPLACE TRIGGER "on_user_integrations_updated" BEFORE UPDATE ON "public"."user_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_ai_processing_start_time" BEFORE UPDATE ON "public"."artifacts" FOR EACH ROW WHEN (((("old"."ai_parsing_status")::"text" IS DISTINCT FROM ("new"."ai_parsing_status")::"text") OR ("old"."ai_processing_started_at" IS DISTINCT FROM "new"."ai_processing_started_at"))) EXECUTE FUNCTION "public"."handle_artifact_ai_processing_start"();



CREATE OR REPLACE TRIGGER "sync_primary_email_trigger" AFTER INSERT OR UPDATE ON "public"."contact_emails" FOR EACH ROW EXECUTE FUNCTION "public"."sync_primary_email"();



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_initiator_contact_id_fkey" FOREIGN KEY ("initiator_contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_initiator_user_id_fkey" FOREIGN KEY ("initiator_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_recipient_contact_id_fkey" FOREIGN KEY ("recipient_contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_sync_logs"
    ADD CONSTRAINT "calendar_sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_emails"
    ADD CONSTRAINT "contact_emails_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_specific_sync_jobs"
    ADD CONSTRAINT "contact_specific_sync_jobs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_specific_sync_jobs"
    ADD CONSTRAINT "contact_specific_sync_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_update_suggestions"
    ADD CONSTRAINT "contact_update_suggestions_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_update_suggestions"
    ADD CONSTRAINT "contact_update_suggestions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_update_suggestions"
    ADD CONSTRAINT "contact_update_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_analytics"
    ADD CONSTRAINT "loop_analytics_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_analytics"
    ADD CONSTRAINT "loop_analytics_loop_artifact_id_fkey" FOREIGN KEY ("loop_artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_analytics"
    ADD CONSTRAINT "loop_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_suggestions"
    ADD CONSTRAINT "loop_suggestions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_suggestions"
    ADD CONSTRAINT "loop_suggestions_created_loop_id_fkey" FOREIGN KEY ("created_loop_id") REFERENCES "public"."artifacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."loop_suggestions"
    ADD CONSTRAINT "loop_suggestions_source_artifact_id_fkey" FOREIGN KEY ("source_artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_suggestions"
    ADD CONSTRAINT "loop_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loop_templates"
    ADD CONSTRAINT "loop_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."next_connections"
    ADD CONSTRAINT "next_connections_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."next_connections"
    ADD CONSTRAINT "next_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow inserts for sync jobs" ON "public"."contact_specific_sync_jobs" FOR INSERT TO "authenticated", "service_role" WITH CHECK (((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "user_id")) OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Allow inserts for user sync logs" ON "public"."calendar_sync_logs" FOR INSERT TO "authenticated", "service_role" WITH CHECK (((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "user_id")) OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Allow updates for sync jobs" ON "public"."contact_specific_sync_jobs" FOR UPDATE TO "authenticated", "service_role" USING ((("auth"."uid"() = "user_id") OR ("auth"."role"() = 'service_role'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Allow updates for sync logs" ON "public"."calendar_sync_logs" FOR UPDATE TO "authenticated", "service_role" USING (((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "user_id")) OR ("auth"."role"() = 'service_role'::"text"))) WITH CHECK (((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "user_id")) OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Users and service can view sync logs" ON "public"."calendar_sync_logs" FOR SELECT TO "authenticated", "service_role" USING ((("auth"."uid"() = "user_id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Users can manage artifacts for their contacts" ON "public"."artifacts" TO "authenticated" USING ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "artifacts"."contact_id") AND ("c"."user_id" = "auth"."uid"())))))) WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."contacts" "c"
  WHERE (("c"."id" = "artifacts"."contact_id") AND ("c"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage emails for their contacts" ON "public"."contact_emails" USING (("contact_id" IN ( SELECT "contacts"."id"
   FROM "public"."contacts"
  WHERE ("contacts"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage their own contacts" ON "public"."contacts" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own integrations" ON "public"."user_integrations" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own loop suggestions" ON "public"."loop_suggestions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own loop templates" ON "public"."loop_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own next_connections" ON "public"."next_connections" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own suggestions" ON "public"."contact_update_suggestions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own loop analytics" ON "public"."loop_analytics" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own suggestions" ON "public"."contact_update_suggestions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own sync jobs" ON "public"."contact_specific_sync_jobs" FOR SELECT TO "authenticated", "service_role" USING ((("auth"."uid"() = "user_id") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_specific_sync_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_update_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loop_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loop_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loop_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."next_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_decrypted_secret"("secret_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_decrypted_secret"("secret_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_decrypted_secret"("secret_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_integration"("p_user_id" "uuid", "p_integration_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_integration"("p_user_id" "uuid", "p_integration_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_integration"("p_user_id" "uuid", "p_integration_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_artifact_ai_processing_start"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_artifact_ai_processing_start"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_artifact_ai_processing_start"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_email_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_email_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_email_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_primary_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_primary_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_primary_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_ai_parsing"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_ai_parsing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_ai_parsing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contact_calendar_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contact_calendar_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contact_calendar_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_meeting_ai_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_meeting_ai_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_meeting_ai_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_voice_memo_transcription"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_voice_memo_transcription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_voice_memo_transcription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_user_integration"("p_user_id" "uuid", "p_integration_type" "text", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone, "p_scopes" "text"[], "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_user_integration"("p_user_id" "uuid", "p_integration_type" "text", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone, "p_scopes" "text"[], "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_integration"("p_user_id" "uuid", "p_integration_type" "text", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone, "p_scopes" "text"[], "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."artifacts" TO "anon";
GRANT ALL ON TABLE "public"."artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."calendar_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."contact_emails" TO "anon";
GRANT ALL ON TABLE "public"."contact_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_emails" TO "service_role";



GRANT ALL ON TABLE "public"."contact_specific_sync_jobs" TO "anon";
GRANT ALL ON TABLE "public"."contact_specific_sync_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_specific_sync_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."contact_update_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."contact_update_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_update_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."loop_analytics" TO "anon";
GRANT ALL ON TABLE "public"."loop_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."loop_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."loop_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."loop_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."loop_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."loop_templates" TO "anon";
GRANT ALL ON TABLE "public"."loop_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."loop_templates" TO "service_role";



GRANT ALL ON TABLE "public"."next_connections" TO "anon";
GRANT ALL ON TABLE "public"."next_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."next_connections" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
