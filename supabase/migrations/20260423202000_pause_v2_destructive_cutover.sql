-- ============================================================================
-- Pause V2 — destructive cutover migration
--
-- Drops every legacy reflections-as-pause artefact in one transaction.
-- Runs at merge time; rollback past this point requires a DB restore.
--
-- Order (dependencies first, so CASCADE matters less):
--   1. Triggers + functions that reference the tables below.
--   2. Legacy engagement views (v_reflection_with_companions, etc.).
--   3. Drop columns on tables that FK-reference reflections.
--   4. Drop follow_ups (hard FK to reflections; feature being retired).
--   5. Drop pause_notifications (superseded by notifications table).
--   6. Drop reflection_companions (superseded by pause_ai_artifacts).
--   7. Drop reflections itself (CASCADE catches remaining dependents).
--   8. Truncate user_badges so BadgesPanelV2's silent-seed path runs
--      on every user's first post-cutover Profile open.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Reflections-scoped triggers + helper functions.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
DROP TRIGGER IF EXISTS trg_reflections_set_engaged_at ON public.reflections;
DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;

DROP FUNCTION IF EXISTS public.notifications_from_reflections();
DROP FUNCTION IF EXISTS public.notifications_from_pause_notifications();
DROP FUNCTION IF EXISTS public.set_reflection_engaged_at();
DROP FUNCTION IF EXISTS public.purge_orphan_notification_reflections(integer);
DROP FUNCTION IF EXISTS public.find_similar_reflection(uuid, uuid);
DROP FUNCTION IF EXISTS public.find_similar_reflection(uuid, uuid, integer);

-- ---------------------------------------------------------------------------
-- 1b. Rewrite public.get_holzen_number() to query V2 — otherwise the
--     holzen-number edge function RPC breaks the moment reflections is
--     dropped below. V2 semantics match: % of completed pauses in the
--     last 7 days whose outcome is 'held' or 'nothing'.
-- ---------------------------------------------------------------------------
-- Query base tables (not v_pause_full) because the view is
-- security_invoker=true; calling it from a DEFINER function would scope
-- to only the invoker's own pauses. The function computes a global
-- aggregate so we need DEFINER-scoped reads on pause_instances +
-- pause_step_events directly.
CREATE OR REPLACE FUNCTION public.get_holzen_number()
  RETURNS jsonb
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  WITH latest_outcomes AS (
    SELECT DISTINCT ON (e.pause_instance_id)
           e.pause_instance_id,
           e.payload->>'outcome' AS outcome
      FROM public.pause_step_events e
     WHERE e.step_type = 'outcome_logged'
     ORDER BY e.pause_instance_id, e.created_at DESC
  ),
  window_rows AS (
    SELECT lo.outcome
      FROM public.pause_instances pi
      JOIN latest_outcomes lo ON lo.pause_instance_id = pi.id
     WHERE pi.state = 'completed'
       AND pi.completed_at >= (now() - interval '7 days')
  )
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE outcome IS NOT NULL),
    'held_steady', COUNT(*) FILTER (WHERE outcome IN ('held','nothing')),
    'percent', CASE
      WHEN COUNT(*) FILTER (WHERE outcome IS NOT NULL) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE outcome IN ('held','nothing'))::numeric /
         COUNT(*) FILTER (WHERE outcome IS NOT NULL)::numeric) * 100
      )
    END,
    'calculated_at', now()
  )
  FROM window_rows;
$$;

-- ---------------------------------------------------------------------------
-- 2. Legacy views. Drop with CASCADE to catch any dependent views.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_reflection_with_companions CASCADE;
DROP VIEW IF EXISTS public.v_reflections_engaged CASCADE;
DROP VIEW IF EXISTS public.v_reflections_completed CASCADE;
DROP VIEW IF EXISTS public.v_notification_response_rate CASCADE;
DROP VIEW IF EXISTS public.v_reflection_with_companion_serve_sources CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Columns on tables that reference reflections — drop the legacy FKs.
--    The paired pause_instance_id columns were added in the additive
--    migration 20260423201300_companion_serves_pause_instance_id.
-- ---------------------------------------------------------------------------
-- Indexes on library_items that depend on reflection_id; drop them first
-- so the column DROP doesn't fail. The actual index from migration
-- 20260319002444 is `idx_library_items_user_reflection_source`. There is
-- also `idx_library_items_reflection` from the original table migration.
DROP INDEX IF EXISTS public.idx_library_items_user_reflection_source;
DROP INDEX IF EXISTS public.idx_library_items_reflection;
ALTER TABLE public.library_items DROP COLUMN IF EXISTS reflection_id CASCADE;

ALTER TABLE public.practice_entries DROP COLUMN IF EXISTS source_reflection_id CASCADE;

ALTER TABLE public.ritual_completions DROP COLUMN IF EXISTS reflection_id CASCADE;

ALTER TABLE public.companion_serves DROP COLUMN IF EXISTS reflection_id CASCADE;

DROP INDEX IF EXISTS public.idx_generation_attempts_reflection_id;
ALTER TABLE public.generation_attempts DROP COLUMN IF EXISTS reflection_id CASCADE;

-- ---------------------------------------------------------------------------
-- 3b. Clean up orphan rows in the unified notifications table whose
--     source_table points at tables we're about to drop. The table
--     itself (public.notifications) stays; only stale 'pause' rows go.
-- ---------------------------------------------------------------------------
DELETE FROM public.notifications
 WHERE source_table IN ('reflections', 'pause_notifications', 'follow_ups');

-- ---------------------------------------------------------------------------
-- 3c. analytics_events feedback index — the companion_feedback writer now
--     persists `metadata.pause_instance_id` (not `metadata.reflection_id`).
--     Swap the partial index so the admin feedback-ratio view lookups stay
--     covered.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_analytics_events_companion_feedback;
CREATE INDEX IF NOT EXISTS idx_analytics_events_companion_feedback
  ON public.analytics_events ((metadata->>'pause_instance_id'), (metadata->>'companion_type'))
  WHERE event = 'companion_feedback';

-- ---------------------------------------------------------------------------
-- 4. follow_ups (hard FK to reflections; feature retired in V2).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.follow_ups CASCADE;

-- ---------------------------------------------------------------------------
-- 5. pause_notifications (unified notifications feed is canonical now).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.pause_notifications CASCADE;

-- ---------------------------------------------------------------------------
-- 6. reflection_companions (pause_ai_artifacts is canonical now).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.reflection_companions CASCADE;

-- ---------------------------------------------------------------------------
-- 7. reflections itself.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.reflections CASCADE;

-- ---------------------------------------------------------------------------
-- 8. Baseline reset for user_badges.
--    BadgesPanelV2's useBadgeSync silently seeds on first render; no push
--    flood. See src/hooks/use-badge-sync.ts.
--    Clean the paired notifications feed rows too — source_id on
--    notifications is not an FK, so orphan badge rows would otherwise
--    linger in the bell after the TRUNCATE.
-- ---------------------------------------------------------------------------
DELETE FROM public.notifications WHERE source_table = 'user_badges';
TRUNCATE public.user_badges RESTART IDENTITY;

-- ---------------------------------------------------------------------------
-- 9. Unschedule cron jobs whose target edge function was deleted in this PR.
--    check-followups was removed because follow_ups has been dropped.
--    cron.unschedule(name) raises if the job doesn't exist, so guard with
--    a lookup; we also try/catch because the extension may not be present
--    in every environment (local psql without pg_cron).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'check-followups-hourly';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
EXCEPTION WHEN undefined_table OR invalid_schema_name THEN
  -- pg_cron not installed (local psql without extensions); safe to skip.
  NULL;
END$$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Post-deletion sanity: all of these should return 0 / empty.
-- (Intentional comments; the operator runs them after sync if they want
-- to verify.)
--
-- SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename
--   IN ('reflections','reflection_companions','pause_notifications','follow_ups');
-- SELECT count(*) FROM information_schema.columns
--   WHERE table_schema='public' AND column_name='reflection_id';
-- SELECT count(*) FROM public.user_badges;
-- ---------------------------------------------------------------------------
