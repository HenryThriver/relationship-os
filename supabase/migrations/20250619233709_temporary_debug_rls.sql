-- Temporary debugging RLS policy for onboarding voice memos
-- File: supabase/migrations/20250619233709_temporary_debug_rls.sql

-- Add a very permissive policy for debugging onboarding voice memo issues
CREATE POLICY "DEBUG: Allow onboarding voice memos"
ON public.artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'voice_memo'
  AND (metadata->>'source' = 'onboarding_voice_recorder' OR metadata->>'is_onboarding' = 'true')
);

-- Comment for documentation
COMMENT ON POLICY "DEBUG: Allow onboarding voice memos" ON public.artifacts 
IS 'Temporary debugging policy - allows all authenticated users to create onboarding voice memos'; 