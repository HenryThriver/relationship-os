-- Enhanced Relationship Sessions Migration
-- Add time-boxing and goal focus capabilities

BEGIN;

-- ===============================================
-- 1. ADD TIME-BOXING AND GOAL FOCUS TO SESSIONS
-- ===============================================

-- Add duration and goal focus to sessions
ALTER TABLE relationship_sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_paused_duration INTEGER DEFAULT 0; -- in seconds

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_goal_id ON relationship_sessions(goal_id);
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_timer ON relationship_sessions(timer_started_at, status);

-- ===============================================
-- 2. UPDATE SESSION TYPES FOR GOAL FOCUS
-- ===============================================

-- Update session_type check constraint to include goal-focused sessions
ALTER TABLE relationship_sessions 
DROP CONSTRAINT IF EXISTS relationship_sessions_session_type_check;

ALTER TABLE relationship_sessions 
ADD CONSTRAINT relationship_sessions_session_type_check 
CHECK (session_type IN ('mixed', 'goal_focused'));

-- Set default session type to goal_focused
ALTER TABLE relationship_sessions 
ALTER COLUMN session_type SET DEFAULT 'goal_focused';

-- ===============================================
-- 3. ADD SESSION ANALYTICS FIELDS
-- ===============================================

-- Track session effectiveness
ALTER TABLE relationship_sessions 
ADD COLUMN IF NOT EXISTS actions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actions_skipped INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_rating INTEGER CHECK (session_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS session_notes TEXT;

-- ===============================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON COLUMN relationship_sessions.duration_minutes IS 'Planned session duration in minutes (15, 30, 45, 60)';
COMMENT ON COLUMN relationship_sessions.goal_id IS 'Specific goal this session focuses on (NULL for mixed sessions)';
COMMENT ON COLUMN relationship_sessions.timer_started_at IS 'When the session timer was started';
COMMENT ON COLUMN relationship_sessions.timer_paused_at IS 'When the session timer was paused (NULL if not paused)';
COMMENT ON COLUMN relationship_sessions.total_paused_duration IS 'Total time paused in seconds';
COMMENT ON COLUMN relationship_sessions.actions_completed IS 'Number of actions completed in this session';
COMMENT ON COLUMN relationship_sessions.actions_skipped IS 'Number of actions skipped in this session';
COMMENT ON COLUMN relationship_sessions.session_rating IS 'User rating of session effectiveness (1-5)';

COMMIT; 