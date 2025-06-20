-- Fix RLS policy for onboarding voice memos
-- File: supabase/migrations/20250619233458_fix_onboarding_voice_memo_rls.sql

-- Add a more permissive policy for onboarding voice memos
-- This allows authenticated users to create voice memo artifacts for their own self-contact
CREATE POLICY "Users can create onboarding voice memos for themselves"
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
  AND (metadata->>'source' = 'onboarding_voice_recorder' OR metadata->>'is_onboarding' = 'true')
);

-- Comment for documentation
COMMENT ON POLICY "Users can create onboarding voice memos for themselves" ON public.artifacts 
IS 'Allows users to create voice memo artifacts for their own self-contact during onboarding'; 