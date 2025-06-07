-- Consolidated Email AI Processing and Cleanup
-- Migration: 20250607131723_consolidated_email_ai_processing.sql
-- Consolidates: 20250604221608, 20250605005455, 20250605010731, 20250605010904, 20250605011321, 20250605011706

-- ===============================================
-- PART 1: CLEANUP DUPLICATE EMAILS
-- ===============================================

-- Safe cleanup of duplicate email artifacts
-- Remove duplicate email artifacts while keeping the most recent version
WITH duplicates_to_delete AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY contact_id, (metadata->>'message_id') 
      ORDER BY created_at DESC
    ) as rn
  FROM artifacts 
  WHERE type = 'email' 
    AND metadata->>'message_id' IS NOT NULL
)
DELETE FROM artifacts 
WHERE id IN (
  SELECT id 
  FROM duplicates_to_delete 
  WHERE rn > 1
);

-- ===============================================
-- PART 2: EMAIL SYNC JOBS INFRASTRUCTURE
-- ===============================================

-- Create email sync jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_addresses TEXT[] NOT NULL,
  date_range_start TIMESTAMP NOT NULL,
  date_range_end TIMESTAMP NOT NULL,
  max_results INTEGER DEFAULT 100,
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'nightly', 'historical_contact_creation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_emails INTEGER DEFAULT 0,
  created_artifacts INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.email_sync_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can access their own email sync jobs" ON public.email_sync_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sync_jobs_status ON public.email_sync_jobs (status);
CREATE INDEX IF NOT EXISTS idx_email_sync_jobs_user_id ON public.email_sync_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_jobs_contact_id ON public.email_sync_jobs (contact_id);

-- Grant permissions
GRANT ALL ON TABLE public.email_sync_jobs TO authenticated, service_role;

-- ===============================================
-- PART 3: NEW CONTACT EMAIL SYNC TRIGGER
-- ===============================================

-- Function to trigger historical email sync when contact is created
CREATE OR REPLACE FUNCTION public.trigger_new_contact_email_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contact_emails TEXT[];
BEGIN
  -- Collect all email addresses for this contact
  contact_emails := ARRAY[]::TEXT[];
  
  -- Add primary email if exists
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    contact_emails := array_append(contact_emails, NEW.email);
  END IF;
  
  -- Only proceed if we have email addresses
  IF array_length(contact_emails, 1) > 0 THEN
    -- Insert a job to sync 3 years of email history
    INSERT INTO public.email_sync_jobs (
      contact_id,
      user_id,
      email_addresses,
      date_range_start,
      date_range_end,
      max_results,
      sync_type,
      status,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      contact_emails,
      (NOW() - INTERVAL '3 years')::timestamp,
      NOW()::timestamp,
      500, -- Higher limit for historical sync
      'historical_contact_creation',
      'pending',
      jsonb_build_object(
        'triggered_by', 'contact_creation',
        'contact_name', NEW.name,
        'created_at', NOW()
      )
    );
    
    RAISE LOG 'Created email sync job for new contact: % (emails: %)', NEW.name, contact_emails;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the contact creation
    RAISE WARNING 'Error creating email sync job for contact %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.trigger_new_contact_email_sync() TO authenticated;

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS new_contact_email_sync_trigger ON public.contacts;
CREATE TRIGGER new_contact_email_sync_trigger
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_contact_email_sync();

-- ===============================================
-- PART 4: AI PROCESSING INFRASTRUCTURE
-- ===============================================

-- Create debug table for tracking trigger calls
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

-- Update existing email artifacts to have pending AI parsing status
UPDATE public.artifacts 
SET ai_parsing_status = 'pending'
WHERE type = 'email' 
  AND ai_parsing_status IS NULL;

-- ===============================================
-- PART 5: EMAIL AI PROCESSING TRIGGER (FINAL VERSION)
-- ===============================================

-- Drop any existing versions
DROP FUNCTION IF EXISTS public.trigger_email_ai_processing() CASCADE;

-- Create the final working version of the email AI processing function
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

    -- Set Edge Function URL
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

-- Create the final trigger
DROP TRIGGER IF EXISTS on_email_artifact_created ON public.artifacts;
CREATE TRIGGER on_email_artifact_created
  AFTER INSERT OR UPDATE ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_email_ai_processing();

-- ===============================================
-- PART 6: PROCESS EXISTING EMAILS
-- ===============================================

-- Process existing email artifacts that haven't been processed
-- This will trigger the AI processing for existing emails
UPDATE public.artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NOW()
WHERE type = 'email' 
  AND (ai_parsing_status IS NULL OR ai_parsing_status = 'pending')
  AND content IS NOT NULL;

-- ===============================================
-- MIGRATION NOTES
-- ===============================================
-- This migration consolidates the following migrations:
-- - 20250604221608_cleanup_duplicate_emails.sql: Duplicate email cleanup and sync jobs
-- - 20250605005455_add_email_ai_processing.sql: Initial AI processing setup
-- - 20250605010731_fix_email_ai_trigger.sql: Hardcoded URL fix
-- - 20250605010904_fix_email_trigger_param.sql: Parameter name fix (artifactId)
-- - 20250605011321_fix_http_post_call.sql: Correct net.http_post signature
-- - 20250605011706_debug_email_trigger.sql: Added debugging and error handling 