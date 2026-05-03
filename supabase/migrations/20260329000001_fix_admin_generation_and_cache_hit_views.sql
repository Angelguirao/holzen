-- Align admin analytics views with generation_attempts.status values and companion_serves.serve_source.
-- Replaces intent of update_failure_rate_view.sql (invalid filename — never applied by CLI) while
-- keeping security_barrier + same shape as 20260328112857 for grants / get_admin_stats.

-- security_barrier stays as set by 20260328112857 (omit WITH on OR REPLACE)
CREATE OR REPLACE VIEW public.v_generation_failure_rate AS
SELECT
  companion_type,
  provider,
  model,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'timeout') AS timeouts,
  COUNT(*) FILTER (WHERE status = 'quality_gate_failed') AS quality_gate_failures,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE status != 'success'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS failure_pct,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
  COUNT(*) FILTER (WHERE status = 'rate_limited') AS rate_limited
FROM public.generation_attempts
WHERE created_at >= (now() - interval '30 days')
GROUP BY companion_type, provider, model;

-- Column order changed vs 20260320205315; OR REPLACE is unsafe on fresh reset (see migration-view-safety.md).
DROP VIEW IF EXISTS public.v_companion_cache_hit_rate;

CREATE VIEW public.v_companion_cache_hit_rate WITH (security_barrier = true) AS
SELECT
  companion_type,
  COUNT(*) AS total_serves,
  COUNT(*) FILTER (WHERE serve_source = 'cache') AS cache_hits,
  COUNT(*) FILTER (WHERE serve_source = 'live') AS live_generated,
  COUNT(*) FILTER (WHERE serve_source = 'curated') AS curated_fallbacks,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE serve_source = 'cache'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS cache_hit_pct
FROM public.companion_serves
WHERE created_at >= (now() - interval '30 days')
GROUP BY companion_type;

REVOKE SELECT ON public.v_companion_cache_hit_rate FROM public, authenticated, anon;
GRANT SELECT ON public.v_companion_cache_hit_rate TO service_role;
