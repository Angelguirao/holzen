ALTER TABLE public.companion_serves
  DROP CONSTRAINT IF EXISTS companion_serves_serve_source_check;

ALTER TABLE public.companion_serves
  ADD CONSTRAINT companion_serves_serve_source_check
  CHECK (serve_source IN ('live', 'library', 'cache', 'curated', 'empty'));

COMMENT ON COLUMN public.companion_serves.serve_source IS
  'Where the served row came from: live (AI), library (content_library), cache (companion_cache), curated (hardcoded fallback), empty (disabled / all tiers failed).';

DROP VIEW IF EXISTS public.v_companion_cache_hit_rate;

CREATE VIEW public.v_companion_cache_hit_rate AS
SELECT
  companion_type,
  COUNT(*) AS total_serves,
  COUNT(*) FILTER (WHERE serve_source = 'cache') AS cache_hits,
  COUNT(*) FILTER (WHERE serve_source = 'library') AS library_hits,
  COUNT(*) FILTER (WHERE serve_source = 'live') AS live_generated,
  COUNT(*) FILTER (WHERE serve_source = 'curated') AS curated_fallbacks,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE serve_source = 'cache'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS cache_hit_pct
FROM public.companion_serves
WHERE created_at >= (now() - interval '30 days')
GROUP BY companion_type;