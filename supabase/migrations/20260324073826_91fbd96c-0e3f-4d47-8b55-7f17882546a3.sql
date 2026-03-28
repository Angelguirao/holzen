-- Per-user cache serve tracking table
CREATE TABLE IF NOT EXISTS user_companion_serves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_entry_id uuid NOT NULL REFERENCES companion_cache(id) ON DELETE CASCADE,
  companion_type text NOT NULL,
  served_at timestamptz DEFAULT now(),
  UNIQUE (user_id, cache_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_user_companion_serves_user 
  ON user_companion_serves(user_id, companion_type);
CREATE INDEX IF NOT EXISTS idx_user_companion_serves_cache 
  ON user_companion_serves(cache_entry_id);

ALTER TABLE user_companion_serves ENABLE ROW LEVEL SECURITY;

-- Idempotent: table + policies may already exist (20260321000001_user_cache_tracking.sql).
DROP POLICY IF EXISTS "Users can view own companion serve history" ON user_companion_serves;
DROP POLICY IF EXISTS "Service role full access on user_companion_serves" ON user_companion_serves;

CREATE POLICY "Users can view own companion serve history"
  ON user_companion_serves FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on user_companion_serves"
  ON user_companion_serves FOR ALL
  USING (auth.role() = 'service_role');

-- Index on market_regime for context-aware cache queries
CREATE INDEX IF NOT EXISTS idx_companion_cache_market_regime
  ON companion_cache(market_regime)
  WHERE market_regime IS NOT NULL;

-- Composite index for common cache query pattern
CREATE INDEX IF NOT EXISTS idx_companion_cache_type_regime_quality
  ON companion_cache(companion_type, language, quality_score DESC)
  WHERE quality_score >= 2;