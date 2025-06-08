-- Fix enum casting issues in DELETE statements for LinkedIn posts
-- The DELETE statement in the duplicate prevention migration was causing enum comparison errors

-- Since the original DELETE might have failed, let's ensure clean state
-- by properly casting the enum comparisons

-- Clean up any remaining LinkedIn post duplicates with proper enum casting
DELETE FROM public.artifacts 
WHERE type = 'linkedin_post'::public.artifact_type_enum 
AND id NOT IN (
  SELECT DISTINCT ON (metadata->>'post_id', contact_id, user_id) id 
  FROM public.artifacts 
  WHERE type = 'linkedin_post'::public.artifact_type_enum
  ORDER BY metadata->>'post_id', contact_id, user_id, created_at ASC
);

-- Log the cleanup
SELECT 'LinkedIn post DELETE statements fixed with proper enum casting' as cleanup_status; 