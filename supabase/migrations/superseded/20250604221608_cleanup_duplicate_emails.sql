-- Safe cleanup of duplicate email artifacts
-- This migration removes duplicate email artifacts while keeping the most recent version

-- Delete duplicates, keeping only the most recent version
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

-- Add trigger for new contact email sync
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

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS new_contact_email_sync_trigger ON public.contacts;
CREATE TRIGGER new_contact_email_sync_trigger
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_contact_email_sync();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.trigger_new_contact_email_sync() TO authenticated;
GRANT ALL ON TABLE public.email_sync_jobs TO authenticated, service_role; 