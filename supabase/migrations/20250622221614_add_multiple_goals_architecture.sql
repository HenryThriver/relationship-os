-- Multiple Goals Architecture Migration
-- File: supabase/migrations/20250622221614_add_multiple_goals_architecture.sql
-- Purpose: Enable multiple goals with distinct contact associations

-- ===============================================
-- PART 1: GOALS TABLE
-- ===============================================

-- Create dedicated goals table for multiple goals per user
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal Definition
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  timeline TEXT,
  success_criteria TEXT,
  
  -- Goal Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Source Information
  voice_memo_id UUID REFERENCES public.artifacts(id),
  created_from TEXT DEFAULT 'onboarding' CHECK (created_from IN ('onboarding', 'manual', 'ai_suggestion')),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- PART 2: GOAL-CONTACT ASSOCIATIONS
-- ===============================================

-- Junction table for goals and contacts (many-to-many)
CREATE TABLE IF NOT EXISTS public.goal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Association Details
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'mentor', 'advisor', 'peer', 'collaborator', 'client', 'investor', 
    'hiring_manager', 'recruiter', 'industry_expert', 'connector', 'other'
  )),
  relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  
  -- How this contact helps with this goal
  how_they_help TEXT,
  interaction_frequency TEXT CHECK (interaction_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed')),
  last_interaction_date DATE,
  next_planned_interaction DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique goal-contact pairs per user
  UNIQUE(goal_id, contact_id, user_id)
);

-- ===============================================
-- PART 3: GOAL MILESTONES
-- ===============================================

-- Track milestones/sub-goals within each main goal
CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Milestone Details
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- PART 4: INDEXES AND CONSTRAINTS
-- ===============================================

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON public.goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_is_primary ON public.goals(is_primary);
CREATE INDEX IF NOT EXISTS idx_goals_created_from ON public.goals(created_from);

-- Goal contacts indexes
CREATE INDEX IF NOT EXISTS idx_goal_contacts_goal_id ON public.goal_contacts(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contacts_contact_id ON public.goal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_goal_contacts_user_id ON public.goal_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contacts_relationship_type ON public.goal_contacts(relationship_type);
CREATE INDEX IF NOT EXISTS idx_goal_contacts_relevance_score ON public.goal_contacts(relevance_score);

-- Goal milestones indexes
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON public.goal_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_status ON public.goal_milestones(status);

-- Ensure only one primary goal per user (but allow multiple active goals)
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_user_primary 
ON public.goals(user_id) WHERE is_primary = TRUE;

-- ===============================================
-- PART 5: TRIGGERS
-- ===============================================

-- Updated at triggers
CREATE TRIGGER on_goals_updated
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_goal_contacts_updated
  BEFORE UPDATE ON public.goal_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_goal_milestones_updated
  BEFORE UPDATE ON public.goal_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================
-- PART 6: RLS POLICIES
-- ===============================================

-- Goals RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Goal contacts RLS
ALTER TABLE public.goal_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goal contacts" ON public.goal_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Goal milestones RLS
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goal milestones" ON public.goal_milestones
  FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- PART 7: HELPER FUNCTIONS
-- ===============================================

-- Function to create a goal from onboarding voice memo
CREATE OR REPLACE FUNCTION public.create_goal_from_voice_memo(
  p_user_id UUID,
  p_voice_memo_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_timeline TEXT DEFAULT NULL,
  p_success_criteria TEXT DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  goal_id UUID;
BEGIN
  INSERT INTO public.goals (
    user_id,
    title,
    description,
    category,
    timeline,
    success_criteria,
    is_primary,
    voice_memo_id,
    created_from,
    status
  ) VALUES (
    p_user_id,
    p_title,
    p_description,
    p_category,
    p_timeline,
    p_success_criteria,
    p_is_primary,
    p_voice_memo_id,
    'onboarding',
    'active'
  ) RETURNING id INTO goal_id;
  
  RETURN goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get primary goal for a user
CREATE OR REPLACE FUNCTION public.get_primary_goal(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  timeline TEXT,
  success_criteria TEXT,
  progress_percentage INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.title, g.description, g.category, g.timeline, 
         g.success_criteria, g.progress_percentage, g.created_at
  FROM public.goals g
  WHERE g.user_id = p_user_id 
    AND g.is_primary = TRUE 
    AND g.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- PART 8: DATA MIGRATION (PRESERVE EXISTING GOALS)
-- ===============================================

-- Migrate existing primary_goal data from contacts table to new goals table
INSERT INTO public.goals (
  user_id,
  title,
  description,
  timeline,
  success_criteria,
  is_primary,
  created_from,
  status
)
SELECT 
  c.user_id,
  COALESCE(c.primary_goal, 'Professional Networking Goal') as title,
  c.goal_description,
  c.goal_timeline,
  c.goal_success_criteria,
  TRUE as is_primary,
  'onboarding' as created_from,
  'active' as status
FROM public.contacts c
WHERE c.is_self_contact = TRUE 
  AND c.primary_goal IS NOT NULL 
  AND c.primary_goal != ''
ON CONFLICT DO NOTHING;

-- ===============================================
-- PART 9: COMMENTS
-- ===============================================

COMMENT ON TABLE public.goals IS 'User goals with support for multiple goals per user';
COMMENT ON TABLE public.goal_contacts IS 'Associates specific contacts with specific goals';
COMMENT ON TABLE public.goal_milestones IS 'Tracks progress milestones within each goal';

COMMENT ON COLUMN public.goals.is_primary IS 'Only one primary goal per user allowed';
COMMENT ON COLUMN public.goals.created_from IS 'Source of goal creation (onboarding, manual, ai_suggestion)';
COMMENT ON COLUMN public.goal_contacts.relationship_type IS 'How this contact relates to this specific goal';
COMMENT ON COLUMN public.goal_contacts.relevance_score IS 'How relevant this contact is to this goal (0-1)';

COMMENT ON FUNCTION public.create_goal_from_voice_memo IS 'Creates a goal from onboarding voice memo data';
COMMENT ON FUNCTION public.get_primary_goal IS 'Gets the user primary goal with all details'; 