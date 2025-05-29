-- Consolidated Calendar Automation System Migration
-- File: supabase/migrations/20250528174915_consolidated_calendar_automation.sql
-- 
-- This migration consolidates the complete automated Google Calendar sync system
-- including nightly syncs and contact email addition triggers.

-- ============================================================================
-- STEP 1: Fix calendar_sync_logs RLS policies for background jobs
-- ============================================================================

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Allow inserts for user sync logs" ON public.calendar_sync_logs;

-- Create simplified policy that works with both authenticated users and service role
CREATE POLICY "Allow inserts for user sync logs" ON public.calendar_sync_logs
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (
        -- Simple check: authenticated users can insert logs for themselves
        (auth.role() = 'authenticated' AND auth.uid() = user_id) OR
        -- Service role can insert anything (for background jobs)
        auth.role() = 'service_role'
    );

-- ============================================================================
-- STEP 2: Contact-specific sync jobs system
-- ============================================================================

-- Create the contact_specific_sync_jobs table
CREATE TABLE IF NOT EXISTS public.contact_specific_sync_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_options JSONB NOT NULL DEFAULT jsonb_build_object(
        'lookbackDays', 180,    -- 6 months back for comprehensive history
        'lookforwardDays', 60,  -- 2 months forward for upcoming meetings
        'trigger', 'email_added'
    ),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_sync_jobs_status ON public.contact_specific_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_contact_sync_jobs_created_at ON public.contact_specific_sync_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_sync_jobs_contact_id ON public.contact_specific_sync_jobs(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_sync_jobs_user_id ON public.contact_specific_sync_jobs(user_id);

-- Create partial unique index for pending jobs only (prevents duplicate pending jobs per contact)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_contact_job 
ON public.contact_specific_sync_jobs(contact_id) 
WHERE status = 'pending';

-- Add table and column comments
COMMENT ON TABLE public.contact_specific_sync_jobs IS 'Queue for contact-specific calendar sync jobs triggered by email additions';
COMMENT ON COLUMN public.contact_specific_sync_jobs.sync_options IS 'JSON options for the sync including date ranges and trigger type';
COMMENT ON COLUMN public.contact_specific_sync_jobs.metadata IS 'Additional metadata about the job including trigger details';

-- Enable RLS for contact_specific_sync_jobs
ALTER TABLE public.contact_specific_sync_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact sync jobs (drop existing first)
DROP POLICY IF EXISTS "Users can view their own sync jobs" ON public.contact_specific_sync_jobs;
DROP POLICY IF EXISTS "Allow inserts for sync jobs" ON public.contact_specific_sync_jobs;
DROP POLICY IF EXISTS "Allow updates for sync jobs" ON public.contact_specific_sync_jobs;

CREATE POLICY "Users can view their own sync jobs" ON public.contact_specific_sync_jobs
    FOR SELECT 
    TO authenticated, service_role
    USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow inserts for sync jobs" ON public.contact_specific_sync_jobs
    FOR INSERT 
    TO authenticated, service_role
    WITH CHECK (
        -- Users can create jobs for their own contacts
        (auth.role() = 'authenticated' AND auth.uid() = user_id) OR
        -- Service role can create jobs (for triggers and background processing)
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow updates for sync jobs" ON public.contact_specific_sync_jobs
    FOR UPDATE 
    TO authenticated, service_role
    USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- ============================================================================
-- STEP 3: Contact email addition trigger system
-- ============================================================================

-- Function to create sync job when email is added to a contact
CREATE OR REPLACE FUNCTION public.trigger_contact_calendar_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contact_owner_id UUID;
BEGIN
    -- Get the user who owns this contact
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
    ON CONFLICT ON CONSTRAINT idx_unique_pending_contact_job DO UPDATE SET
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
        created_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the original email insert
        RAISE WARNING 'Error creating calendar sync job for contact %: %', NEW.contact_id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger on contact_emails table
DROP TRIGGER IF EXISTS contact_email_added_sync_trigger ON public.contact_emails;
CREATE TRIGGER contact_email_added_sync_trigger
    AFTER INSERT ON public.contact_emails
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_contact_calendar_sync();

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION public.trigger_contact_calendar_sync() TO authenticated;

-- ============================================================================
-- STEP 4: Automated cron job scheduling
-- ============================================================================

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing calendar sync cron jobs
DO $$
BEGIN
  PERFORM cron.unschedule('nightly-calendar-sync');
  PERFORM cron.unschedule('process-contact-sync-jobs');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if jobs don't exist
    NULL;
END
$$;

-- Schedule the nightly calendar sync to run every day at 3 AM UTC
-- Syncs 7 days back, 30 days forward for all users
SELECT cron.schedule(
  'nightly-calendar-sync',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1/nightly-calendar-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcGF3cGhwbGNpc2lldmNkdWd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU4MDIxMSwiZXhwIjoyMDUzMTU2MjExfQ.b_2oGT4ksF4sJkmT6lvBH-7YM_j_ZhWKBVh6qvWJWjQ'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule the contact sync job processor to run every 5 minutes
-- Processes contact-specific sync jobs triggered by email additions
SELECT cron.schedule(
  'process-contact-sync-jobs',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1/process-contact-sync-jobs',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcGF3cGhwbGNpc2lldmNkdWd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU4MDIxMSwiZXhwIjoyMDUzMTU2MjExfQ.b_2oGT4ksF4sJkmT6lvBH-7YM_j_ZhWKBVh6qvWJWjQ'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

-- Log the successful setup
DO $$
BEGIN
    RAISE NOTICE '🎉 Calendar Automation System Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Features Enabled:';
    RAISE NOTICE '   • Nightly calendar sync (3 AM UTC): 7 days back, 30 days forward';
    RAISE NOTICE '   • Contact email triggers: 6 months back, 2 months forward';
    RAISE NOTICE '   • Contact sync job processor (every 5 minutes)';
    RAISE NOTICE '   • Fixed calendar_sync_logs RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Edge Functions Required:';
    RAISE NOTICE '   • nightly-calendar-sync';
    RAISE NOTICE '   • process-contact-sync-jobs';
    RAISE NOTICE '';
    RAISE NOTICE '📊 System ready for automated calendar integration!';
END;
$$; 