-- Add LinkedIn posts sync tracking to contacts table
ALTER TABLE public.contacts 
ADD COLUMN linkedin_posts_last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN linkedin_posts_sync_status TEXT DEFAULT 'never';

-- Add index for sync status queries
CREATE INDEX idx_contacts_linkedin_sync_status ON public.contacts(linkedin_posts_sync_status);

-- Add index for sync timing queries
CREATE INDEX idx_contacts_linkedin_last_sync ON public.contacts(linkedin_posts_last_sync_at);

-- Update comments
COMMENT ON COLUMN public.contacts.linkedin_posts_last_sync_at IS 'Timestamp of last LinkedIn posts sync for this contact';
COMMENT ON COLUMN public.contacts.linkedin_posts_sync_status IS 'Status of LinkedIn posts sync: never, in_progress, completed, failed'; 