-- Temporarily bypass RLS for onboarding voice memos only
-- File: supabase/migrations/20250619234000_bypass_rls_for_onboarding_voice_memos.sql

-- Add a policy that allows ANY authenticated user to create onboarding voice memos
-- This is temporary to debug the specific issue with onboarding uploads
CREATE POLICY "TEMP: Allow all authenticated users to create onboarding voice memos"
ON public.artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'voice_memo'
  AND (
    metadata->>'source' = 'onboarding_voice_recorder' 
    OR metadata->>'is_onboarding' = 'true'
    OR (metadata->>'memo_type' IN ('challenge', 'recognition'))
  )
);

-- Comment for documentation
COMMENT ON POLICY "TEMP: Allow all authenticated users to create onboarding voice memos" ON public.artifacts 
IS 'Temporary policy to bypass RLS issues specifically for onboarding voice memo uploads - REMOVE AFTER DEBUGGING'; 