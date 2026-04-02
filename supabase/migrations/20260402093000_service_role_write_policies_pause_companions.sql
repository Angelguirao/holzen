-- ============================================================================
-- Service-role hardening: explicit write policies for pause/companion pipeline
-- ============================================================================
--
-- Why:
--   Several edge functions / cron workers write into RLS-enabled tables using
--   the Supabase service-role key (which bypasses RLS). This migration adds
--   explicit service_role policies as defense-in-depth and to make the
--   security invariant self-documenting.
--
-- Scope (from docs/reviews/phase-8-rls-hardening-service-role-policies.md):
--   pause_notifications, reflections, profiles, analytics_events,
--   companion_cache, companion_serves, generation_attempts
--
-- Notes:
--   - We intentionally do not change existing authenticated-user policies.
--   - Policies are scoped to auth.role() = 'service_role'.
--   - Uses FOR ALL to cover INSERT/UPDATE/DELETE where cron/edge workers may
--     touch rows (e.g. companion_cache lifecycle pruning).

-- ---------------------------------------------------------------------------
-- pause_notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.pause_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on pause_notifications" ON public.pause_notifications;
CREATE POLICY "Service role full access on pause_notifications"
  ON public.pause_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- reflections
-- ---------------------------------------------------------------------------
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on reflections" ON public.reflections;
CREATE POLICY "Service role full access on reflections"
  ON public.reflections
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on analytics_events" ON public.analytics_events;
CREATE POLICY "Service role full access on analytics_events"
  ON public.analytics_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- companion_cache
-- ---------------------------------------------------------------------------
ALTER TABLE public.companion_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on companion_cache" ON public.companion_cache;
CREATE POLICY "Service role full access on companion_cache"
  ON public.companion_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- companion_serves
-- ---------------------------------------------------------------------------
ALTER TABLE public.companion_serves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on companion_serves" ON public.companion_serves;
CREATE POLICY "Service role full access on companion_serves"
  ON public.companion_serves
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- generation_attempts
-- ---------------------------------------------------------------------------
ALTER TABLE public.generation_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on generation_attempts" ON public.generation_attempts;
CREATE POLICY "Service role full access on generation_attempts"
  ON public.generation_attempts
  FOR ALL
  USING (auth.role() = 'service_role');

