-- Add missing columns to loop_templates table

ALTER TABLE loop_templates
ADD COLUMN IF NOT EXISTS default_title_template TEXT,
ADD COLUMN IF NOT EXISTS default_status TEXT NOT NULL DEFAULT 'idea',
ADD COLUMN IF NOT EXISTS reciprocity_direction TEXT NOT NULL DEFAULT 'giving';

-- Add CHECK constraints for default_status and reciprocity_direction
-- Note: Enum types like LoopStatus are application-level concepts.
-- For database constraints, we use CHECK constraints on TEXT fields.

ALTER TABLE loop_templates
ADD CONSTRAINT check_loop_template_status CHECK (default_status IN (
    'idea', 'queued', 'offered', 'received', 'accepted', 'in_progress', 
    'delivered', 'completed', 'cancelled', 'on_hold', 'delegated', 'following_up'
)),
ADD CONSTRAINT check_loop_template_reciprocity CHECK (reciprocity_direction IN ('giving', 'receiving')); 