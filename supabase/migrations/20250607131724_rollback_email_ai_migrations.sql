-- Rollback email AI processing migrations to prepare for consolidated version
-- Migration: 20250607131724_rollback_email_ai_migrations.sql
-- Rolls back: 20250604221608, 20250605005455, 20250605010731, 20250605010904, 20250605011321, 20250605011706

-- Drop triggers first
DROP TRIGGER IF EXISTS on_email_artifact_created ON public.artifacts;
DROP TRIGGER IF EXISTS new_contact_email_sync_trigger ON public.contacts;

-- Drop functions
DROP FUNCTION IF EXISTS public.trigger_email_ai_processing() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_new_contact_email_sync() CASCADE;

-- Drop debug table (we'll recreate it in the consolidated migration)
DROP TABLE IF EXISTS public.trigger_debug_log;

-- Drop email sync jobs table (we'll recreate it in the consolidated migration)
DROP TABLE IF EXISTS public.email_sync_jobs;

-- Reset ai_parsing_status for all email artifacts to prepare for clean reprocessing
UPDATE public.artifacts 
SET ai_parsing_status = NULL, 
    ai_processing_started_at = NULL
WHERE type = 'email'; 