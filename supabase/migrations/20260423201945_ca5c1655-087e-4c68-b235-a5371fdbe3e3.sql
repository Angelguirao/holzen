-- Fix unsafe CREATE OR REPLACE VIEW pattern in v_companion_cache_hit_rate.
-- The 20260329000001 migration reordered columns relative to the original
-- 20260320205315 definition, which Postgres rejects on a fresh `db reset`.
-- This migration drops the view (and dependents) and recreates it with the
-- final, intended shape including library_hits added in later migrations.

DROP VIEW IF EXISTS public.v_companion_cache_hit_rate CASCADE;

CREATE VIEW public.v_companion_cache_hit_rate AS
SELECT
  companion_type,
  COUNT(*) AS total_serves,
  COUNT(*) FILTER (WHERE serve_source = 'cache') AS cache_hits,
  COUNT(*) FILTER (WHERE serve_source = 'live') AS live_generated,
  COUNT(*) FILTER (WHERE serve_source = 'curated') AS curated_fallbacks,
  COUNT(*) FILTER (WHERE serve_source = 'library') AS library_hits,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE serve_source = 'cache'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS cache_hit_pct
FROM public.companion_serves
WHERE created_at >= (now() - interval '30 days')
GROUP BY companion_type;

-- Re-grant access for admin analytics (matches prior migrations).
GRANT SELECT ON public.v_companion_cache_hit_rate TO authenticated;