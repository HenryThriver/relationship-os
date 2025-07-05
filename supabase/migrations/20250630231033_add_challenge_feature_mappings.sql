-- Add challenge feature mappings to store LLM-determined feature associations
-- This stores an array of objects with challenge text and associated feature key
-- Format: [{"challenge": "I forget names", "featureKey": "contact_intelligence"}, ...]

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS challenge_feature_mappings JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.contacts.challenge_feature_mappings IS 'Array of challenge-feature mappings determined by LLM: [{"challenge": "text", "featureKey": "key"}]';

-- Create index for better query performance on challenge feature mappings
CREATE INDEX IF NOT EXISTS idx_contacts_challenge_feature_mappings 
ON public.contacts USING GIN (challenge_feature_mappings);

-- Add RLS policy for challenge feature mappings (same as other contact data)
-- This inherits from existing contact RLS policies, no additional policy needed 