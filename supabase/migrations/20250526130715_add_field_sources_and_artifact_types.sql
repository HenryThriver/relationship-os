-- Add new artifact types to artifact_type_enum if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'email' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'email';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'meeting' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'meeting';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'note' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'note';
  END IF;
  -- Add linkedin_profile if it's not there from previous migrations (it should be, but good practice to check)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'linkedin_profile' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'linkedin_profile';
  END IF;
END;
$$;

-- Add field_sources column to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS field_sources JSONB;

-- Optionally, you might want to add a comment to the column
COMMENT ON COLUMN public.contacts.field_sources IS 'Stores a mapping of contact field paths to the artifact ID that sourced the data for that field.'; 