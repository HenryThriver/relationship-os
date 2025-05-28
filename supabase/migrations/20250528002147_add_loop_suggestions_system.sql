-- Add to migration: add_loop_suggestions_system.sql

CREATE TABLE loop_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  source_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE NOT NULL,
  suggestion_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_created')),
  created_loop_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE loop_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own loop suggestions" ON loop_suggestions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_loop_suggestions_user_contact ON loop_suggestions(user_id, contact_id);
CREATE INDEX idx_loop_suggestions_status ON loop_suggestions(status, created_at); 