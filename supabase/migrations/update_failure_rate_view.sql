-- ============================================================================
-- Update v_generation_failure_rate to include rate_limited count
-- and use companion_serves for cache hit data consistency
-- ============================================================================

-- Updated failure rate view — now includes rate_limited as a separate count
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
  COUNT(*) FILTER (WHERE status = 'rate_limited') AS rate_limited,
  ROUND(
    COUNT(*) FILTER (WHERE status != 'success')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS failure_pct,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM generation_attempts
WHERE created_at >= now() - interval '30 days'
GROUP BY companion_type, provider, model
ORDER BY companion_type, model;

ALTER VIEW public.v_generation_failure_rate SET (security_invoker = true);

-- Updated cache hit rate view — read from companion_serves (same source as daily view)
-- This ensures consistency between the all-time breakdown and period-filtered stat card
CREATE OR REPLACE VIEW public.v_companion_cache_hit_rate AS
SELECT
  companion_type,
  COUNT(*) FILTER (WHERE serve_source = 'cache') AS cache_hits,
  COUNT(*) FILTER (WHERE serve_source = 'live') AS live_generated,
  COUNT(*) FILTER (WHERE serve_source = 'curated') AS curated_fallbacks,
  COUNT(*) AS total_serves,
  ROUND(
    COUNT(*) FILTER (WHERE serve_source = 'cache')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS cache_hit_pct
FROM companion_serves
WHERE created_at >= now() - interval '30 days'
GROUP BY companion_type
ORDER BY companion_type;

ALTER VIEW public.v_companion_cache_hit_rate SET (security_invoker = true);
