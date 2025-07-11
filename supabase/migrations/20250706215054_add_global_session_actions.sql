-- Allow session_id to be nullable for global session actions
-- These are actions created proactively (e.g., during calendar sync) that can be picked up by future sessions

ALTER TABLE public.session_actions 
ALTER COLUMN session_id DROP NOT NULL;

-- Add user_id to session_actions so we can track orphaned actions
ALTER TABLE public.session_actions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the RLS policy to include user_id for orphaned actions
DROP POLICY IF EXISTS "Users can manage session actions" ON public.session_actions;

CREATE POLICY "Users can manage session actions" ON public.session_actions
FOR ALL USING (
  -- User can access actions in their own sessions
  (session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM relationship_sessions 
    WHERE relationship_sessions.id = session_actions.session_id 
    AND relationship_sessions.user_id = auth.uid()
  ))
  OR
  -- User can access their own orphaned actions (no session yet)
  (session_id IS NULL AND user_id = auth.uid())
);

-- Add index for user_id to improve performance
CREATE INDEX IF NOT EXISTS idx_session_actions_user_id 
ON public.session_actions(user_id);

-- Add index for orphaned actions
CREATE INDEX IF NOT EXISTS idx_session_actions_orphaned 
ON public.session_actions(user_id, status) 
WHERE session_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.session_actions.user_id IS 'User who owns this action. Required for orphaned actions (session_id IS NULL)';
COMMENT ON COLUMN public.session_actions.session_id IS 'Session this action belongs to. NULL for orphaned actions created proactively (e.g., during calendar sync)'; 