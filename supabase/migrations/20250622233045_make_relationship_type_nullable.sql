-- Make relationship_type nullable in goal_contacts table
-- This allows imported goal contacts to have undefined relationship types
-- that users can specify later through the UI

-- Drop the existing NOT NULL constraint and CHECK constraint
ALTER TABLE public.goal_contacts 
ALTER COLUMN relationship_type DROP NOT NULL;

-- Recreate the CHECK constraint to allow NULL values
ALTER TABLE public.goal_contacts 
DROP CONSTRAINT IF EXISTS goal_contacts_relationship_type_check;

ALTER TABLE public.goal_contacts 
ADD CONSTRAINT goal_contacts_relationship_type_check 
CHECK (relationship_type IS NULL OR relationship_type IN (
  'mentor', 'advisor', 'peer', 'collaborator', 'client', 'investor', 
  'hiring_manager', 'recruiter', 'industry_expert', 'connector', 'other'
));

-- Add comment explaining the nullable field
COMMENT ON COLUMN public.goal_contacts.relationship_type IS 'How this contact relates to this specific goal. Can be NULL for undefined relationships that users will specify later'; 