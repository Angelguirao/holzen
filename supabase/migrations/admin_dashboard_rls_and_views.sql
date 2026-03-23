-- ============================================================================
-- RLS policies + daily breakdown views for admin dashboard period filtering
-- ============================================================================
--
-- Problem: The admin dashboard queries companion_serves and generation_attempts
-- directly, but these tables only have service-role write access. The user's
-- JWT can't read them, so period-filtered stats always return 0.
--
-- Solution:
-- 1. Add RLS SELECT policies for authenticated users (read-only)
-- 2. Create daily breakdown views for serves and failures
--    so period filtering works like it does for costs
-- ============================================================================

-- ── 1. RLS policies for read access ──

-- companion_serves: allow authenticated users to read their own serves
ALTER TABLE companion_serves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companion serves"
  ON companion_serves FOR SELECT
  USING (user_id = auth.uid());

-- Also allow reading all serves for admin views (needed for aggregate stats)
-- This uses a permissive policy — any authenticated user can read all serves.
-- If you want to restrict to admin only, add a role check instead.
CREATE POLICY "Authenticated users can view all companion serves"
  ON companion_serves FOR SELECT
  USING (auth.role() = 'authenticated');

-- generation_attempts: allow authenticated users to read all attempts
ALTER TABLE generation_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view generation attempts"
  ON generation_attempts FOR SELECT
  USING (auth.role() = 'authenticated');

-- analytics_events: allow authenticated users to read their own events
-- (needed for feedback queries)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid());

-- ── 2. Daily breakdown views ──

-- Serves per day per companion type (for period-filtered serve counts)
CREATE OR REPLACE VIEW public.v_companion_serves_per_day AS
SELECT
  DATE(created_at) AS day,
  companion_type,
  serve_source,
  COUNT(*) AS serve_count
FROM companion_serves
WHERE created_at >= now() - interval '90 days'
GROUP BY DATE(created_at), companion_type, serve_source
ORDER BY day DESC, companion_type;

ALTER VIEW public.v_companion_serves_per_day SET (security_invoker = true);

-- Failures per day per model (for period-filtered failure rates)
CREATE OR REPLACE VIEW public.v_generation_failures_per_day AS
SELECT
  DATE(created_at) AS day,
  companion_type,
  model,
  status,
  COUNT(*) AS attempt_count,
  AVG(latency_ms) AS avg_latency_ms,
  SUM(COALESCE(estimated_cost_usd, 0)) AS total_cost_usd
FROM generation_attempts
WHERE created_at >= now() - interval '90 days'
GROUP BY DATE(created_at), companion_type, model, status
ORDER BY day DESC, companion_type;

ALTER VIEW public.v_generation_failures_per_day SET (security_invoker = true);

-- Feedback per day (for period-filtered feedback counts)
CREATE OR REPLACE VIEW public.v_companion_feedback_per_day AS
SELECT
  DATE(created_at) AS day,
  COALESCE(metadata->>'cache_type', metadata->>'companion_type') AS companion_type,
  metadata->>'vote' AS vote,
  COUNT(*) AS vote_count
FROM analytics_events
WHERE event = 'companion_feedback'
  AND metadata->>'vote' IS NOT NULL
  AND created_at >= now() - interval '90 days'
GROUP BY DATE(created_at), COALESCE(metadata->>'cache_type', metadata->>'companion_type'), metadata->>'vote'
ORDER BY day DESC;

ALTER VIEW public.v_companion_feedback_per_day SET (security_invoker = true);
