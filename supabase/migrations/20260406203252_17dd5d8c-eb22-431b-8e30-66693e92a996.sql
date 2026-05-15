-- 1) Recreate the view with grounding COALESCE logic
DROP VIEW IF EXISTS public.v_reflection_with_companions;

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
  CASE
    WHEN gc.id IS NOT NULL THEN COALESCE(gc.read, false)
    ELSE r.grounding_read
  END AS grounding_read,
  COALESCE(gc.content ->> 'title', r.grounding_title) AS grounding_title,
  COALESCE(gc.content ->> 'body', r.grounding_body) AS grounding_body,
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
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  hc.content AS history_insight_data,
  hc.read AS history_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  COALESCE(zc.content, zdt.content) AS zoom_out_data,
  COALESCE(zc.read, zdt.read) AS zoom_out_read,
  COALESCE(zc.content, zdt.content) AS companion_zoom_out_data,
  COALESCE(zc.read, zdt.read) AS companion_zoom_out_read,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'signal'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_signal,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'ground_nudge'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_ground_nudge,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'historical_insight'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_historical_insight,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id
      AND cs.companion_type IN ('zoom_out', 'zoom_out_deep_time')
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_zoom_out
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out'
LEFT JOIN reflection_companions zdt ON zdt.reflection_id = r.id AND zdt.companion_type = 'zoom_out_deep_time';

-- 2) content_library title_norm + indexes
ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS title_norm text
  GENERATED ALWAYS AS (lower(regexp_replace(trim(title), '\s+', ' ', 'g'))) STORED;

CREATE INDEX IF NOT EXISTS idx_content_library_type_title_norm_active
  ON public.content_library (type, title_norm)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_content_library_url_active
  ON public.content_library (url)
  WHERE active = true AND url IS NOT NULL AND length(trim(url)) > 0;