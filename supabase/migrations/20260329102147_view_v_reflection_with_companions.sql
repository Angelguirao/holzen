
-- Drop and recreate view to handle both zoom_out and zoom_out_deep_time companion types,
-- and drop legacy signal/zoom/history columns from reflections that no longer exist in code.

DROP VIEW IF EXISTS public.v_reflection_with_companions;

-- Drop legacy columns that are now fully in reflection_companions
ALTER TABLE public.reflections
  DROP COLUMN IF EXISTS signal_title,
  DROP COLUMN IF EXISTS signal_body,
  DROP COLUMN IF EXISTS signal_source,
  DROP COLUMN IF EXISTS signal_url,
  DROP COLUMN IF EXISTS signal_read,
  DROP COLUMN IF EXISTS zoom_out_data,
  DROP COLUMN IF EXISTS zoom_out_read,
  DROP COLUMN IF EXISTS history_insight_data,
  DROP COLUMN IF EXISTS history_read;

-- Recreate view with COALESCE for zoom_out / zoom_out_deep_time
CREATE VIEW public.v_reflection_with_companions
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.user_id,
  r.message,
  r.context,
  r.created_at,
  r.is_favorite,
  r.haiku,
  r.outcome,
  r.mood,
  r.note,
  r.tags,
  r.breathing_completed,
  r.haiku_read,
  r.mood_after,
  r.grounding_read,
  r.grounding_title,
  r.grounding_body,
  -- Signal from reflection_companions
  sc.content ->> 'title' AS signal_title,
  sc.content ->> 'body' AS signal_body,
  sc.content ->> 'source' AS signal_source,
  sc.content ->> 'url' AS signal_url,
  sc.read AS signal_read,
  sc.content ->> 'title' AS companion_signal_title,
  sc.content ->> 'body' AS companion_signal_body,
  sc.content ->> 'source' AS companion_signal_source,
  sc.content ->> 'url' AS companion_signal_url,
  sc.read AS companion_signal_read,
  -- Grounding from reflection_companions
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  -- History from reflection_companions
  hc.content AS history_insight_data,
  hc.read AS history_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  -- Zoom out: COALESCE both zoom_out and zoom_out_deep_time types
  COALESCE(zc.content, zdt.content) AS zoom_out_data,
  COALESCE(zc.read, zdt.read) AS zoom_out_read,
  COALESCE(zc.content, zdt.content) AS companion_zoom_out_data,
  COALESCE(zc.read, zdt.read) AS companion_zoom_out_read
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out'
LEFT JOIN reflection_companions zdt ON zdt.reflection_id = r.id AND zdt.companion_type = 'zoom_out_deep_time';
