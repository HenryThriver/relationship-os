-- Add tracking columns for suggestion notifications
ALTER TABLE contact_update_suggestions 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_suggestions_viewed ON contact_update_suggestions(viewed_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON contact_update_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_dismissed ON contact_update_suggestions(dismissed_at);

-- Add constraint for priority values
ALTER TABLE contact_update_suggestions 
ADD CONSTRAINT check_suggestion_priority 
CHECK (priority IN ('high', 'medium', 'low')); 