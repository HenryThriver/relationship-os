-- User Profile Foundations Migration
-- File: supabase/migrations/20250619225218_add_user_profile_foundations.sql
-- Approach: User as special contact in their own network

-- ===============================================
-- PART 1: EXTEND CONTACTS TABLE FOR SELF-CONTACT
-- ===============================================

-- Add flag to identify self-contact
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_self_contact BOOLEAN DEFAULT FALSE;

-- Add user-specific profile fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS goal_description TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS goal_timeline TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS goal_success_criteria TEXT;

-- Add profile completion tracking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_analysis_completed_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add generosity opportunities (ways user can help others)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ways_to_help_others TEXT[] DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS introduction_opportunities TEXT[] DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS knowledge_to_share TEXT[] DEFAULT '{}';

-- Add networking challenges (from voice memos)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS networking_challenges TEXT[] DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS onboarding_voice_memo_ids UUID[] DEFAULT '{}';

-- ===============================================
-- PART 2: CONSTRAINTS AND INDEXES
-- ===============================================

-- Ensure only one self-contact per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_self_contact 
ON public.contacts(user_id) WHERE is_self_contact = TRUE;

-- Add indexes for user profile queries
CREATE INDEX IF NOT EXISTS idx_contacts_is_self ON public.contacts(is_self_contact);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_completion ON public.contacts(profile_completion_score);

-- ===============================================
-- PART 3: ONBOARDING STATE TABLE
-- ===============================================

-- Create onboarding_state table for flow management
CREATE TABLE IF NOT EXISTS public.onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Flow Progress
  current_screen INTEGER DEFAULT 1,
  completed_screens INTEGER[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Screen-specific Data
  challenge_voice_memo_id UUID REFERENCES public.artifacts(id),
  goal_voice_memo_id UUID REFERENCES public.artifacts(id),
  profile_enhancement_voice_memo_id UUID REFERENCES public.artifacts(id),
  linkedin_contacts_added INTEGER DEFAULT 0,
  
  -- Integration Status
  linkedin_connected BOOLEAN DEFAULT FALSE,
  gmail_connected BOOLEAN DEFAULT FALSE,
  calendar_connected BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger for onboarding_state
CREATE TRIGGER on_onboarding_state_updated
  BEFORE UPDATE ON public.onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================
-- PART 4: RLS POLICIES
-- ===============================================

-- RLS for onboarding_state
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding state" ON public.onboarding_state
  FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- PART 5: INDEXES FOR ONBOARDING
-- ===============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_state_user_id 
ON public.onboarding_state(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_current_screen 
ON public.onboarding_state(current_screen);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_last_activity 
ON public.onboarding_state(last_activity_at);

-- ===============================================
-- PART 6: HELPER FUNCTIONS
-- ===============================================

-- Function to get or create self-contact for a user
CREATE OR REPLACE FUNCTION public.get_or_create_self_contact(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  self_contact_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Try to find existing self-contact
  SELECT id INTO self_contact_id
  FROM public.contacts
  WHERE user_id = user_uuid AND is_self_contact = TRUE;
  
  -- If not found, create one
  IF self_contact_id IS NULL THEN
    -- Get user info from auth.users
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', email) 
    INTO user_email, user_name
    FROM auth.users 
    WHERE id = user_uuid;
    
    -- Create self-contact
    INSERT INTO public.contacts (
      user_id,
      name,
      email,
      is_self_contact,
      relationship_score,
      created_at,
      updated_at
    ) VALUES (
      user_uuid,
      COALESCE(user_name, user_email, 'My Profile'),
      user_email,
      TRUE,
      6, -- Max relationship score for self
      NOW(),
      NOW()
    ) RETURNING id INTO self_contact_id;
  END IF;
  
  RETURN self_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize onboarding for new users
CREATE OR REPLACE FUNCTION public.initialize_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  self_contact_id UUID;
BEGIN
  -- Create self-contact
  self_contact_id := public.get_or_create_self_contact(NEW.id);
  
  -- Create onboarding state
  INSERT INTO public.onboarding_state (user_id, started_at, last_activity_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- PART 7: TRIGGERS
-- ===============================================

-- Trigger to initialize onboarding for new users
CREATE OR REPLACE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_onboarding();

-- ===============================================
-- PART 8: COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON COLUMN public.contacts.is_self_contact IS 'TRUE if this contact represents the user themselves';
COMMENT ON COLUMN public.contacts.primary_goal IS 'User''s primary professional/networking goal';
COMMENT ON COLUMN public.contacts.goal_description IS 'Detailed description of the user''s goal';
COMMENT ON COLUMN public.contacts.profile_completion_score IS 'Score from 0-100 indicating profile completeness';
COMMENT ON COLUMN public.contacts.ways_to_help_others IS 'Array of ways the user can help others';
COMMENT ON COLUMN public.contacts.networking_challenges IS 'Array of networking challenges identified from voice memos';

COMMENT ON TABLE public.onboarding_state IS 'Tracks user progress through onboarding flow';
COMMENT ON FUNCTION public.get_or_create_self_contact(UUID) IS 'Gets or creates a self-contact record for a user';
COMMENT ON FUNCTION public.initialize_user_onboarding() IS 'Initializes onboarding state and self-contact for new users'; 