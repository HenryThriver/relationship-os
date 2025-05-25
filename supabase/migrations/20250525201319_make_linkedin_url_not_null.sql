-- Make linkedin_url in contacts table NOT NULL
ALTER TABLE public.contacts
ALTER COLUMN linkedin_url SET NOT NULL;
