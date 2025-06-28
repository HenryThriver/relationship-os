-- Add imported_goal_contacts field to onboarding_state table
-- This stores the actual imported contact data for the confirmation screen

ALTER TABLE public.onboarding_state 
ADD COLUMN imported_goal_contacts JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_state.imported_goal_contacts IS 'JSON array of imported goal contacts with id, name, linkedin_url, company, and title for confirmation screen display'; 