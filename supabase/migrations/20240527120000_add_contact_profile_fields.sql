-- Add relationship_score and last_interaction_date to the contacts table
ALTER TABLE public.contacts
ADD COLUMN relationship_score SMALLINT,
ADD COLUMN last_interaction_date TIMESTAMPTZ;

COMMENT ON COLUMN public.contacts.relationship_score IS 'Relationship Quality score, e.g., 1-6';
COMMENT ON COLUMN public.contacts.last_interaction_date IS 'Timestamp of the last recorded interaction with the contact'; 