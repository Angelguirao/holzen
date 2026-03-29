-- Recreate analytics views with SECURITY BARRIER so RLS applies
-- and add admin-only RLS policies

-- Drop and recreate views as security barrier views
-- v_companion_cache_hit_rate
DROP VIEW IF EXISTS public.v_companion_cache_hit_rate;
CREATE VIEW public.v_companion_cache_hit_rate WITH (security_barrier = true) AS
SELECT
  companion_type,
  COUNT(*) AS total_serves,
  COUNT(*) FILTER (WHERE serve_source = 'cache') AS cache_hits,
  COUNT(*) FILTER (WHERE serve_source = 'live') AS live_generated,
  COUNT(*) FILTER (WHERE serve_source = 'curated_fallback') AS curated_fallbacks,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE serve_source = 'cache'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS cache_hit_pct
FROM public.companion_serves
WHERE created_at >= (now() - interval '30 days')
GROUP BY companion_type;

-- v_companion_cost_per_day
DROP VIEW IF EXISTS public.v_companion_cost_per_day;
CREATE VIEW public.v_companion_cost_per_day WITH (security_barrier = true) AS
SELECT
  date_trunc('day', created_at)::date AS day,
  companion_type,
  COUNT(*) AS attempts,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM public.generation_attempts
WHERE created_at >= (now() - interval '30 days')
GROUP BY 1, 2;

-- v_generation_failure_rate
DROP VIEW IF EXISTS public.v_generation_failure_rate;
CREATE VIEW public.v_generation_failure_rate WITH (security_barrier = true) AS
SELECT
  companion_type,
  provider,
  model,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) FILTER (WHERE status = 'error') AS errors,
  COUNT(*) FILTER (WHERE status = 'timeout') AS timeouts,
  COUNT(*) FILTER (WHERE status = 'quality_gate') AS quality_gate_failures,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE status != 'success'))::numeric / COUNT(*)::numeric * 100, 1)
    ELSE 0
  END AS failure_pct,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM public.generation_attempts
WHERE created_at >= (now() - interval '30 days')
GROUP BY 1, 2, 3;

-- v_companion_feedback_ratio
DROP VIEW IF EXISTS public.v_companion_feedback_ratio;
CREATE VIEW public.v_companion_feedback_ratio WITH (security_barrier = true) AS
SELECT
  companion_type,
  SUM(thumbs_up) AS total_thumbs_up,
  SUM(thumbs_down) AS total_thumbs_down,
  COUNT(*) FILTER (WHERE COALESCE(thumbs_up,0) + COALESCE(thumbs_down,0) > 0) AS items_with_feedback,
  CASE WHEN SUM(COALESCE(thumbs_up,0) + COALESCE(thumbs_down,0)) > 0
    THEN ROUND(SUM(thumbs_up)::numeric / SUM(COALESCE(thumbs_up,0) + COALESCE(thumbs_down,0))::numeric * 100, 1)
    ELSE 0
  END AS approval_pct
FROM public.companion_cache
GROUP BY companion_type;

-- Now enable RLS on these views (Postgres 15+ supports RLS on views when security_barrier is set)
-- Actually, RLS on views requires them to be security_barrier, but policies must be on underlying tables
-- The proper approach is to use a security definer function instead
-- Let's use grants to restrict access

-- Revoke access from authenticated/anon and grant only via is_admin() check
-- Since we can't add RLS to views directly in all PG versions, we'll use a different approach:
-- Create a wrapper function that checks admin status

REVOKE SELECT ON public.v_companion_cache_hit_rate FROM authenticated, anon, public;
REVOKE SELECT ON public.v_companion_cost_per_day FROM authenticated, anon, public;
REVOKE SELECT ON public.v_generation_failure_rate FROM authenticated, anon, public;
REVOKE SELECT ON public.v_companion_feedback_ratio FROM authenticated, anon, public;

-- Also revoke on other admin analytics views
REVOKE SELECT ON public.v_companion_avg_latency FROM authenticated, anon, public;
REVOKE SELECT ON public.v_companion_serves_per_day FROM authenticated, anon, public;
REVOKE SELECT ON public.v_companion_feedback_per_day FROM authenticated, anon, public;
REVOKE SELECT ON public.v_generation_failures_per_day FROM authenticated, anon, public;

-- Grant back to service_role only (edge functions and admin RPC will use service_role)
GRANT SELECT ON public.v_companion_cache_hit_rate TO service_role;
GRANT SELECT ON public.v_companion_cost_per_day TO service_role;
GRANT SELECT ON public.v_generation_failure_rate TO service_role;
GRANT SELECT ON public.v_companion_feedback_ratio TO service_role;
GRANT SELECT ON public.v_companion_avg_latency TO service_role;
GRANT SELECT ON public.v_companion_serves_per_day TO service_role;
GRANT SELECT ON public.v_companion_feedback_per_day TO service_role;
GRANT SELECT ON public.v_generation_failures_per_day TO service_role;

-- Create a security definer function to query admin stats safely
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'cache_hits', (SELECT jsonb_agg(row_to_json(t)) FROM v_companion_cache_hit_rate t),
    'costs', (SELECT jsonb_agg(row_to_json(t)) FROM v_companion_cost_per_day t),
    'failures', (SELECT jsonb_agg(row_to_json(t)) FROM v_generation_failure_rate t),
    'feedback', (SELECT jsonb_agg(row_to_json(t)) FROM v_companion_feedback_ratio t)
  ) INTO result;

  RETURN result;
END;
$$;

-- Fix reflection_companions policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can view their own companion data" ON public.reflection_companions;
DROP POLICY IF EXISTS "Users can update their own companion data" ON public.reflection_companions;

CREATE POLICY "Users can view their own companion data"
ON public.reflection_companions
FOR SELECT
TO authenticated
USING (reflection_id IN (SELECT id FROM reflections WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own companion data"
ON public.reflection_companions
FOR UPDATE
TO authenticated
USING (reflection_id IN (SELECT id FROM reflections WHERE user_id = auth.uid()));
