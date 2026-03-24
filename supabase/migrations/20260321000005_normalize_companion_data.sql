-- ============================================================================
-- Normalize companion data: reflections → reflection_companions join table
-- ============================================================================
-- 
-- MOTIVATION:
-- The reflections table currently stores companion data in 10+ denormalized
-- columns (signal_title, signal_body, signal_source, signal_url,
-- learning_title, learning_body, learning_citation, learning_url,
-- zoom_out_data, history_insight_data). This makes it hard to:
-- - Add new companion types without schema changes
-- - Query companion data independently
-- - Build analytics on companion content
--
-- This migration creates a normalized join table and copies existing data.
-- The old columns are NOT dropped — they remain for backward compatibility
-- during the transition period.
--
-- ROLLBACK: Drop the reflection_companions table.
-- ============================================================================

-- Step 1: Create the normalized join table
CREATE TABLE IF NOT EXISTS reflection_companions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reflection_id uuid NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  companion_type text NOT NULL,  -- 'signal', 'ground_nudge', 'historical_insight', 'zoom_out'
  content jsonb NOT NULL,        -- Full companion data as JSON
  cache_entry_id uuid REFERENCES companion_cache(id),
  read boolean DEFAULT false,    -- Whether the user has expanded/read this companion
  created_at timestamptz DEFAULT now(),
  
  -- One companion per type per reflection
  UNIQUE (reflection_id, companion_type)
);

-- Step 2: Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reflection_companions_reflection_id 
  ON reflection_companions(reflection_id);
CREATE INDEX IF NOT EXISTS idx_reflection_companions_type 
  ON reflection_companions(companion_type);
CREATE INDEX IF NOT EXISTS idx_reflection_companions_reflection_type 
  ON reflection_companions(reflection_id, companion_type);

-- Step 3: RLS policies (match reflections table pattern)
ALTER TABLE reflection_companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companion data"
  ON reflection_companions FOR SELECT
  USING (
    reflection_id IN (
      SELECT id FROM reflections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own companion data"
  ON reflection_companions FOR UPDATE
  USING (
    reflection_id IN (
      SELECT id FROM reflections WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON reflection_companions FOR ALL
  USING (auth.role() = 'service_role');

-- Step 4: Migrate existing data from denormalized columns
-- This is idempotent — uses ON CONFLICT to skip already-migrated rows.

-- Signal companions
INSERT INTO reflection_companions (reflection_id, companion_type, content, read)
SELECT 
  id as reflection_id,
  'signal' as companion_type,
  jsonb_build_object(
    'title', signal_title,
    'body', signal_body,
    'source', signal_source,
    'url', signal_url
  ) as content,
  COALESCE(signal_read, false) as read
FROM reflections
WHERE signal_title IS NOT NULL AND signal_source IS NOT NULL
ON CONFLICT (reflection_id, companion_type) DO NOTHING;

-- Grounding (learning) companions
INSERT INTO reflection_companions (reflection_id, companion_type, content, read)
SELECT 
  id as reflection_id,
  'ground_nudge' as companion_type,
  jsonb_build_object(
    'title', learning_title,
    'body', learning_body,
    'citation', learning_citation,
    'url', learning_url
  ) as content,
  COALESCE(learning_read, false) as read
FROM reflections
WHERE learning_title IS NOT NULL AND learning_citation IS NOT NULL
ON CONFLICT (reflection_id, companion_type) DO NOTHING;

-- Historical insight companions
INSERT INTO reflection_companions (reflection_id, companion_type, content, read)
SELECT 
  id as reflection_id,
  'historical_insight' as companion_type,
  history_insight_data as content,
  COALESCE(history_read, false) as read
FROM reflections
WHERE history_insight_data IS NOT NULL
ON CONFLICT (reflection_id, companion_type) DO NOTHING;

-- Zoom out companions
INSERT INTO reflection_companions (reflection_id, companion_type, content, read)
SELECT 
  id as reflection_id,
  'zoom_out' as companion_type,
  zoom_out_data as content,
  COALESCE(zoom_out_read, false) as read
FROM reflections
WHERE zoom_out_data IS NOT NULL
ON CONFLICT (reflection_id, companion_type) DO NOTHING;

-- Step 5: Create a view for backward compatibility
-- This view makes reflection_companions look like the old denormalized columns.
-- Existing queries can use this during the transition period.
CREATE OR REPLACE VIEW v_reflection_with_companions AS
SELECT 
  r.*,
  sc.content->>'title' as companion_signal_title,
  sc.content->>'body' as companion_signal_body,
  sc.content->>'source' as companion_signal_source,
  sc.content->>'url' as companion_signal_url,
  sc.read as companion_signal_read,
  gc.content->>'title' as companion_grounding_title,
  gc.content->>'body' as companion_grounding_body,
  gc.content->>'citation' as companion_grounding_citation,
  gc.content->>'url' as companion_grounding_url,
  gc.read as companion_grounding_read,
  hc.content as companion_history_data,
  hc.read as companion_history_read,
  zc.content as companion_zoom_out_data,
  zc.read as companion_zoom_out_read
FROM reflections r
LEFT JOIN reflection_companions sc 
  ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc 
  ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc 
  ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc 
  ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out';

-- NOTE: The old columns on reflections are NOT dropped in this migration.
-- They should be dropped in a future migration after all code has been
-- updated to use reflection_companions exclusively.
--
-- Future migration (DO NOT RUN YET):
-- ALTER TABLE reflections DROP COLUMN IF EXISTS signal_title;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS signal_body;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS signal_source;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS signal_url;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS signal_read;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS learning_title;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS learning_body;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS learning_citation;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS learning_url;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS learning_read;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS history_insight_data;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS history_read;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS zoom_out_data;
-- ALTER TABLE reflections DROP COLUMN IF EXISTS zoom_out_read;
