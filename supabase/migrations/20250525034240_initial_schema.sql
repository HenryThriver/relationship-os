-- Helper function to update 'updated_at' columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUM type for artifact types
CREATE TYPE public.artifact_type_enum AS ENUM (
  'note',
  'email',
  'call',
  'meeting',
  'linkedin_message',
  'linkedin_post', -- As per earlier requirement
  'file',
  'other'
);

-- Contacts Table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Link to the user who owns this contact
  name TEXT,
  email TEXT,
  company TEXT,
  title TEXT,
  linkedin_url TEXT UNIQUE, -- From earlier requirement, ensuring it's unique
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger to auto-update 'updated_at' for contacts
CREATE TRIGGER on_contacts_updated
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.contacts IS 'Stores contact information for users.';
COMMENT ON COLUMN public.contacts.user_id IS 'The user who created and owns this contact.';
COMMENT ON COLUMN public.contacts.linkedin_url IS 'LinkedIn profile URL, intended to be unique.';

-- Artifacts Table
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Link to the user who owns this artifact (same as contact owner)
  type public.artifact_type_enum NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, -- 'timestamp' is a keyword, so quoted. Represents when the artifact event occurred.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL -- When the artifact record was created in the DB
  -- No updated_at here as artifacts are generally immutable records of events. If they can be edited, add updated_at.
);

COMMENT ON TABLE public.artifacts IS 'Stores various types of interactions and data points related to contacts.';
COMMENT ON COLUMN public.artifacts.contact_id IS 'Foreign key to the contact this artifact belongs to.';
COMMENT ON COLUMN public.artifacts.user_id IS 'The user who owns this artifact (should match the contact''s owner).';
COMMENT ON COLUMN public.artifacts.type IS 'The type of artifact (e.g., note, email).';
COMMENT ON COLUMN public.artifacts.timestamp IS 'Timestamp of when the actual event/artifact occurred.';
COMMENT ON COLUMN public.artifacts.created_at IS 'Timestamp of when the artifact record was created in the database.';


-- Row Level Security (RLS)
-- Enable RLS for contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see and manage their own contacts
CREATE POLICY "Users can manage their own contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS for artifacts table
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see and manage artifacts for their own contacts
CREATE POLICY "Users can manage artifacts for their contacts"
ON public.artifacts
FOR ALL
TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM contacts c WHERE c.id = artifacts.contact_id AND c.user_id = auth.uid()))
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM contacts c WHERE c.id = artifacts.contact_id AND c.user_id = auth.uid()));

-- Ensure the user_id in artifacts matches the user_id of the associated contact (additional check for integrity, though RLS should handle access)
-- This could also be handled with a trigger if needed, but RLS provides the security boundary.
