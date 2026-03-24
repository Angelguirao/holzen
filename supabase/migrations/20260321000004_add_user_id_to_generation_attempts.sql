-- Add user_id and reflection_id columns to generation_attempts
-- for per-user cost attribution and per-session debugging.
--
-- This migration is safe to run on an existing table — columns are nullable
-- and indexed for query performance.

ALTER TABLE generation_attempts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE generation_attempts ADD COLUMN IF NOT EXISTS reflection_id uuid REFERENCES reflections(id);

CREATE INDEX IF NOT EXISTS idx_generation_attempts_user_id ON generation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_attempts_reflection_id ON generation_attempts(reflection_id);

-- Optional: backfill user_id from analytics_events where possible
-- (This is a best-effort backfill — not all attempts can be correlated)
-- COMMENT: Run manually if needed, not in automated migration
