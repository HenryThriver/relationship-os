-- Add any missing columns to support enhanced features
-- This assumes you already have the basic loop schema from the main implementation

-- Optional: Add B-tree indexes for better performance on specific JSONB text fields
-- CREATE INDEX IF NOT EXISTS idx_artifacts_loop_status_btree ON artifacts ((content->>'status')) WHERE type = 'loop';
-- CREATE INDEX IF NOT EXISTS idx_artifacts_loop_urgency_btree ON artifacts ((content->>'urgency')) WHERE type = 'loop';
-- CREATE INDEX IF NOT EXISTS idx_artifacts_loop_next_action_btree ON artifacts ((content->>'next_action_due')) WHERE type = 'loop'; 