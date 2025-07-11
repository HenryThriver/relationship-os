-- Relationship Sessions Migration
-- Leverages existing goals table and artifact infrastructure

BEGIN;

-- ===============================================
-- 1. ADD TARGET CONTACT COUNT TO EXISTING GOALS
-- ===============================================

-- Add target_contact_count to existing goals table
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS target_contact_count INTEGER DEFAULT 50;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_goals_target_contact_count ON goals(target_contact_count);

-- ===============================================
-- 2. RELATIONSHIP SESSIONS TABLE
-- ===============================================

CREATE TABLE relationship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'mixed',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===============================================
-- 3. SESSION ACTIONS TABLE
-- ===============================================

CREATE TABLE session_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES relationship_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('add_contact', 'add_meeting_notes')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  
  -- References for different action types
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  meeting_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  
  -- Flexible action data
  action_data JSONB DEFAULT '{}',
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===============================================
-- 4. ADD SESSION TRACKING TO CONTACTS
-- ===============================================

-- Track which session created a contact
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS added_via_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

-- ===============================================
-- 5. INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_relationship_sessions_user_id ON relationship_sessions(user_id);
CREATE INDEX idx_relationship_sessions_status ON relationship_sessions(status);
CREATE INDEX idx_session_actions_session_id ON session_actions(session_id);
CREATE INDEX idx_session_actions_status ON session_actions(status);
CREATE INDEX idx_session_actions_type ON session_actions(action_type);
CREATE INDEX idx_contacts_session_id ON contacts(added_via_session_id);

-- ===============================================
-- 6. RLS POLICIES
-- ===============================================

ALTER TABLE relationship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions" ON relationship_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage session actions" ON session_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM relationship_sessions 
      WHERE relationship_sessions.id = session_actions.session_id 
      AND relationship_sessions.user_id = auth.uid()
    )
  );

-- ===============================================
-- 7. UPDATE TRIGGERS
-- ===============================================

CREATE TRIGGER on_relationship_sessions_updated
  BEFORE UPDATE ON relationship_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_session_actions_updated
  BEFORE UPDATE ON session_actions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ===============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON TABLE relationship_sessions IS 'Time-boxed relationship building sessions';
COMMENT ON TABLE session_actions IS 'Individual actions within a relationship session';
COMMENT ON COLUMN goals.target_contact_count IS 'Target number of contacts for this goal (default 50)';
COMMENT ON COLUMN contacts.added_via_session_id IS 'Session that created this contact, if any';

COMMIT; 