-- Add goal_contact_urls field to onboarding_state table
-- This supports the ContactImportScreen for storing LinkedIn URLs before processing

ALTER TABLE public.onboarding_state 
ADD COLUMN goal_contact_urls TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_state.goal_contact_urls IS 'LinkedIn URLs of contacts related to user goals, collected during onboarding'; 