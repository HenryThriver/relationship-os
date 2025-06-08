-- Prevent LinkedIn post duplicates with unique constraint
-- This ensures that even if multiple sync requests happen, we can't insert duplicate posts

-- First, clean up any remaining duplicates (in case there are any left)
DELETE FROM artifacts 
WHERE type = 'linkedin_post' 
AND id NOT IN (
  SELECT DISTINCT ON (metadata->>'post_id', contact_id, user_id) id 
  FROM artifacts 
  WHERE type = 'linkedin_post'
  ORDER BY metadata->>'post_id', contact_id, user_id, created_at ASC
);

-- Create a unique index on LinkedIn post_id per contact per user
-- This prevents duplicate posts for the same contact and user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_linkedin_posts 
ON artifacts (contact_id, user_id, (metadata->>'post_id'))
WHERE type = 'linkedin_post' AND metadata->>'post_id' IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_unique_linkedin_posts IS 'Ensures LinkedIn posts are unique per contact per user based on post_id from metadata';

-- Log the protection
SELECT 'LinkedIn post duplicate protection enabled via unique index' as protection_status; 