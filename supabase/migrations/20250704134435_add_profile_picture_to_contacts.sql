-- Migration: Add profile_picture field to contacts table
-- This allows us to store LinkedIn profile picture URLs for enhanced profile display

-- Add profile_picture column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN profile_picture TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.contacts.profile_picture IS 'URL of the contact''s profile picture, typically extracted from LinkedIn or other sources';

-- Create index for performance (optional, but useful for filtering contacts with pictures)
CREATE INDEX IF NOT EXISTS idx_contacts_profile_picture 
ON public.contacts (profile_picture) 
WHERE profile_picture IS NOT NULL; 