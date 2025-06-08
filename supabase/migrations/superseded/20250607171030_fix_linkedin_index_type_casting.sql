-- Fix LinkedIn posts unique index to handle enum type casting properly
-- The WHERE clause in the index might be causing enum comparison issues

-- Drop the existing index
DROP INDEX IF EXISTS public.idx_unique_linkedin_posts;

-- Recreate with explicit type casting to avoid enum comparison issues
CREATE UNIQUE INDEX idx_unique_linkedin_posts 
ON public.artifacts (contact_id, user_id, (metadata->>'post_id'))
WHERE type = 'linkedin_post'::public.artifact_type_enum AND metadata->>'post_id' IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_unique_linkedin_posts IS 'Ensures LinkedIn posts are unique per contact per user based on post_id from metadata. Uses explicit enum casting to avoid type comparison issues.';

-- Log the fix
SELECT 'LinkedIn post unique index recreated with proper enum casting' as fix_status; 