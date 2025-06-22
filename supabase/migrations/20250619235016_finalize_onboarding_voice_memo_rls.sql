-- Final coherent RLS policy for onboarding voice memos
-- File: supabase/migrations/20250619235016_finalize_onboarding_voice_memo_rls.sql

-- Remove any temporary debugging policies that may have been created
DROP POLICY IF EXISTS "DEBUG: Allow onboarding voice memos" ON public.artifacts;
DROP POLICY IF EXISTS "TEMP: Allow all authenticated users to create onboarding voice memos" ON public.artifacts;
DROP POLICY IF EXISTS "Users can create onboarding voice memos for themselves" ON public.artifacts;

-- Create a properly scoped RLS policy for onboarding voice memos
-- This allows users to create voice memo artifacts for their own self-contact during onboarding
CREATE POLICY "Users can create voice memos for their self-contact"
ON public.artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND type = 'voice_memo'
  AND EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = artifacts.contact_id 
    AND c.user_id = auth.uid() 
    AND c.is_self_contact = TRUE
  )
);

-- Comment for documentation
COMMENT ON POLICY "Users can create voice memos for their self-contact" ON public.artifacts 
IS 'Allows users to create voice memo artifacts for their own self-contact (used in onboarding and other self-reflection features)'; 