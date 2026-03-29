-- Drop the view first so we can remove columns
DROP VIEW IF EXISTS public.v_reflection_with_companions;

-- Drop deprecated learning columns from reflections
ALTER TABLE public.reflections
  DROP COLUMN IF EXISTS learning_title,
  DROP COLUMN IF EXISTS learning_body,
  DROP COLUMN IF EXISTS learning_read,
  DROP COLUMN IF EXISTS learning_citation,
  DROP COLUMN IF EXISTS learning_url;

-- Drop deprecated companion_learning from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS companion_learning;

-- Recreate the view using grounding columns instead
CREATE VIEW public.v_reflection_with_companions AS
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
  r.signal_title,
  r.signal_body,
  r.signal_source,
  r.signal_url,
  r.zoom_out_read,
  r.history_read,
  r.zoom_out_data,
  r.history_insight_data,
  r.signal_read,
  r.mood_after,
  r.grounding_read,
  r.grounding_title,
  r.grounding_body,
  sc.content ->> 'title' AS companion_signal_title,
  sc.content ->> 'body' AS companion_signal_body,
  sc.content ->> 'source' AS companion_signal_source,
  sc.content ->> 'url' AS companion_signal_url,
  sc.read AS companion_signal_read,
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  zc.content AS companion_zoom_out_data,
  zc.read AS companion_zoom_out_read
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out';