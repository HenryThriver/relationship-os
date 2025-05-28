-- Add loop to existing artifact types
ALTER TYPE artifact_type_enum ADD VALUE IF NOT EXISTS 'loop';

-- Loop templates table for reusable workflows
CREATE TABLE loop_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  loop_type TEXT NOT NULL,
  description TEXT,
  default_actions JSONB NOT NULL DEFAULT '[]',
  typical_duration INTEGER, -- days
  follow_up_schedule INTEGER[], -- days after delivery
  completion_criteria TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loop analytics tracking
CREATE TABLE loop_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  loop_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE NOT NULL,
  loop_type TEXT NOT NULL,
  status_transitions JSONB NOT NULL DEFAULT '[]',
  completion_time_days INTEGER,
  success_score DECIMAL(3,2), -- 0.00 to 5.00
  reciprocity_impact DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE loop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own loop templates" ON loop_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own loop analytics" ON loop_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_loop_templates_user_type ON loop_templates(user_id, loop_type);
CREATE INDEX idx_loop_analytics_user_contact ON loop_analytics(user_id, contact_id);
CREATE INDEX idx_loop_analytics_completion ON loop_analytics(completion_time_days, success_score); 