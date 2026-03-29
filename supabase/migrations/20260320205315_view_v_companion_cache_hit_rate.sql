
-- SQL views for companion observability

-- Cache hit rate by companion type (last 7 days)
CREATE OR REPLACE VIEW public.v_companion_cache_hit_rate AS
SELECT
  (metadata->>'companion_type')::text AS companion_type,
  COUNT(*) FILTER (WHERE event = 'companion_cache_hit') AS cache_hits,
  COUNT(*) FILTER (WHERE event = 'companion_live_generated') AS live_generated,
  COUNT(*) FILTER (WHERE event = 'companion_fallback_curated') AS curated_fallbacks,
  COUNT(*) AS total_serves,
  ROUND(
    COUNT(*) FILTER (WHERE event = 'companion_cache_hit')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS cache_hit_pct
FROM analytics_events
WHERE event IN ('companion_cache_hit', 'companion_live_generated', 'companion_fallback_curated')
  AND created_at >= now() - interval '7 days'
GROUP BY (metadata->>'companion_type');

-- Generation failure rate by model (last 7 days)
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
  ROUND(
    COUNT(*) FILTER (WHERE status != 'success')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS failure_pct,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM generation_attempts
WHERE created_at >= now() - interval '7 days'
GROUP BY companion_type, provider, model;

-- Average latency by companion type (last 7 days)
CREATE OR REPLACE VIEW public.v_companion_avg_latency AS
SELECT
  (metadata->>'companion_type')::text AS companion_type,
  ROUND(AVG((metadata->>'latency_ms')::numeric)::numeric, 0) AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'latency_ms')::numeric)::numeric, 0) AS p95_latency_ms,
  COUNT(*) AS sample_count
FROM analytics_events
WHERE event IN ('companion_cache_hit', 'companion_live_generated', 'companion_fallback_curated')
  AND created_at >= now() - interval '7 days'
  AND metadata->>'latency_ms' IS NOT NULL
GROUP BY (metadata->>'companion_type');

-- Cost per companion type per day (last 30 days)
CREATE OR REPLACE VIEW public.v_companion_cost_per_day AS
SELECT
  companion_type,
  DATE(created_at) AS day,
  COUNT(*) AS attempts,
  SUM(COALESCE(estimated_cost_usd, 0)) AS total_cost_usd,
  SUM(COALESCE(input_tokens, 0)) AS total_input_tokens,
  SUM(COALESCE(output_tokens, 0)) AS total_output_tokens
FROM generation_attempts
WHERE created_at >= now() - interval '30 days'
GROUP BY companion_type, DATE(created_at)
ORDER BY day DESC, companion_type;

-- Thumbs up/down ratio by companion type
CREATE OR REPLACE VIEW public.v_companion_feedback_ratio AS
SELECT
  companion_type,
  SUM(COALESCE(thumbs_up, 0)) AS total_thumbs_up,
  SUM(COALESCE(thumbs_down, 0)) AS total_thumbs_down,
  COUNT(*) FILTER (WHERE COALESCE(thumbs_up, 0) + COALESCE(thumbs_down, 0) > 0) AS items_with_feedback,
  ROUND(
    SUM(COALESCE(thumbs_up, 0))::numeric /
    NULLIF(SUM(COALESCE(thumbs_up, 0)) + SUM(COALESCE(thumbs_down, 0)), 0) * 100, 1
  ) AS approval_pct
FROM companion_cache
GROUP BY companion_type;
