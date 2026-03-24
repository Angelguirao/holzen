-- ============================================================================
-- Admin dashboard: is_admin role, RLS policies, and daily breakdown views
-- ============================================================================
--
-- Run this ONCE in Supabase SQL Editor. It sets up everything needed for
-- the /admin dashboard to work with proper security.
--
-- What it does:
-- 1. Adds is_admin column to profiles
-- 2. Creates is_admin() helper function for RLS
-- 3. Enables RLS on monitoring tables with admin-only read access
-- 4. Creates daily breakdown views for period filtering
-- 5. Sets your user as admin
-- ============================================================================

-- ═══════════════════════════════════════════
-- STEP 1: Admin role on profiles
-- ═══════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Helper function used by RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE user_id = auth.uid()),
    false
  );
$$;

-- Set your user as admin (replace UUID if needed)
UPDATE profiles SET is_admin = true
WHERE user_id = '7b74332c-5d57-4c37-ac6b-676ca3498fc1';

-- ═══════════════════════════════════════════
-- STEP 2: RLS policies (admin-only read access)
-- ═══════════════════════════════════════════

-- companion_serves: only admins can read
ALTER TABLE companion_serves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own companion serves" ON companion_serves;
DROP POLICY IF EXISTS "Authenticated users can view all companion serves" ON companion_serves;
DROP POLICY IF EXISTS "Admins can view all companion serves" ON companion_serves;
CREATE POLICY "Admins can view all companion serves"
  ON companion_serves FOR SELECT
  USING (public.is_admin());

-- generation_attempts: only admins can read
ALTER TABLE generation_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view generation attempts" ON generation_attempts;
DROP POLICY IF EXISTS "Admins can view generation attempts" ON generation_attempts;
CREATE POLICY "Admins can view generation attempts"
  ON generation_attempts FOR SELECT
  USING (public.is_admin());

-- analytics_events: users see their own, admins see all
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (public.is_admin());

-- ═══════════════════════════════════════════
-- STEP 3: Daily breakdown views (for period filtering)
-- ═══════════════════════════════════════════

-- Serves per day (admin reads via is_admin() RLS on companion_serves)
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

-- Generation attempts per day (admin reads via is_admin() RLS)
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

-- Feedback per day (admin reads via is_admin() RLS on analytics_events)
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

-- ═══════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════
-- To add more admins:
--   UPDATE profiles SET is_admin = true WHERE user_id = 'their-uuid-here';
--
-- To revoke admin:
--   UPDATE profiles SET is_admin = false WHERE user_id = 'their-uuid-here';
