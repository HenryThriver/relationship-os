-- Enhance existing contacts table with JSON context fields
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS professional_context JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS personal_context JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS linkedin_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS relationship_score INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS connection_cadence_days INTEGER DEFAULT 42;

-- Add constraints
-- Constraint for relationship_score (0-6)
-- First, drop existing constraint if it was named differently or had different conditions by mistake from previous attempts or other schemas.
-- This is a common pattern but be cautious if you know a specific constraint name to drop.
-- ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_relationship_score_check; 
-- The user's request uses ADD CONSTRAINT check_relationship_score, so a simple ADD is fine if it does not exist.
-- If a constraint with this name or on this column with different definition exists, this might fail.
-- Supabase might auto-generate a name if one isn't specified, e.g. contacts_relationship_score_check
-- We should ensure this doesn't conflict if there was an old one.
-- For now, assuming no conflicting constraint or that this is the first time it's being added with this name.
ALTER TABLE public.contacts ADD CONSTRAINT check_relationship_score CHECK (relationship_score >= 0 AND relationship_score <= 6);

-- Add indexes for JSON querying
CREATE INDEX IF NOT EXISTS idx_contacts_professional_context ON public.contacts USING GIN (professional_context);
CREATE INDEX IF NOT EXISTS idx_contacts_personal_context ON public.contacts USING GIN (personal_context);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_data ON public.contacts USING GIN (linkedin_data); -- Index for the new linkedin_data field

-- Track scheduled connections and meeting prep
CREATE TABLE IF NOT EXISTS public.next_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Assuming user_id from auth.users for RLS
  
  connection_type VARCHAR(50) NOT NULL, -- 'video_call', 'phone', 'coffee', 'event', etc.
  scheduled_date TIMESTAMPTZ,
  location TEXT, -- 'Virtual (Zoom)', 'Starbucks downtown', etc.
  
  agenda JSONB DEFAULT '{}'::jsonb, -- Structured agenda with celebrate/follow_up/new_topics
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for updated_at on next_connections
CREATE TRIGGER handle_next_connections_updated_at BEFORE UPDATE ON public.next_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS for next_connections table
ALTER TABLE public.next_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own next_connections" ON public.next_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_next_connections_contact_id ON public.next_connections(contact_id);
CREATE INDEX IF NOT EXISTS idx_next_connections_user_id ON public.next_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_next_connections_scheduled_date ON public.next_connections(scheduled_date);

-- Ensure artifact_type_enum includes 'pog' and 'ask' if they are not already present.
-- This is idempotent and safe to run. It tries to add them if they don't exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pog' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'pog';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ask' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'ask';
  END IF;
END
$$; 