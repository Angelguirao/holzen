-- ============================================================================
-- Pause V2 — Phase L: legacy hard-delete
--
-- !! DO NOT RUN WITHOUT 14 DAYS OF GREEN POST-CUTOVER MONITORING !!
-- See:
--   - docs/ops/pause-v2-post-cutover-monitoring.md §7 "Green-light criteria"
--   - docs/ops/pause-v2-cutover-runbook.md
--
-- This file is NOT a migration (it deliberately lives in docs/ops/ so it
-- never auto-applies on GitHub -> Lovable sync). The operator copies
-- these statements into the SQL editor after confirming the branch is
-- clean per the monitoring runbook.
--
-- Once applied, rollback to the V1 pause system requires a DB restore.
-- This is the user-confirmed "no legacy compatibility" outcome from
-- /opt/cursor/artifacts/PLAN.md §15.
--
-- The deletion is ordered to respect FKs:
--   1. Drop triggers + functions that reference reflections.
--   2. Drop the engagement-safe views and the normalized companion join.
--   3. Drop library_items.reflection_id.
--   4. Drop pause_notifications.
--   5. Drop reflection_companions.
--   6. Drop reflections.
--   7. Remove the pause_v2_enabled feature flag.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Triggers + trigger functions that reference reflections / pause_notifications
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
DROP TRIGGER IF EXISTS trg_reflections_set_engaged_at ON public.reflections;
DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;

DROP FUNCTION IF EXISTS public.notifications_from_reflections();
DROP FUNCTION IF EXISTS public.notifications_from_pause_notifications();
DROP FUNCTION IF EXISTS public.set_reflection_engaged_at();
DROP FUNCTION IF EXISTS public.purge_orphan_notification_reflections(integer);
DROP FUNCTION IF EXISTS public.find_similar_reflection(uuid, uuid);

-- ---------------------------------------------------------------------------
-- 2. Views that read reflections / reflection_companions
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_reflection_with_companions CASCADE;
DROP VIEW IF EXISTS public.v_reflections_engaged CASCADE;
DROP VIEW IF EXISTS public.v_reflections_completed CASCADE;
DROP VIEW IF EXISTS public.v_notification_response_rate CASCADE;

-- ---------------------------------------------------------------------------
-- 3. library_items.reflection_id
-- ---------------------------------------------------------------------------
-- The pause_instance_id column shipped in Phase F; its unique index
-- already mirrors the legacy unique constraint. Drop the old column + its
-- dependent indexes/constraints.
ALTER TABLE public.library_items
  DROP CONSTRAINT IF EXISTS library_items_user_id_reflection_id_source_type_key;

DROP INDEX IF EXISTS public.idx_library_items_reflection_id;
DROP INDEX IF EXISTS public.library_items_user_id_reflection_id_source_type_key;

ALTER TABLE public.library_items
  DROP COLUMN IF EXISTS reflection_id;

-- ---------------------------------------------------------------------------
-- 4. pause_notifications (superseded by unified `notifications` feed)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.pause_notifications CASCADE;

-- ---------------------------------------------------------------------------
-- 5. reflection_companions (superseded by pause_ai_artifacts)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.reflection_companions CASCADE;

-- ---------------------------------------------------------------------------
-- 6. reflections itself (companion_serves.reflection_id is ON DELETE SET NULL
--    in the legacy schema, so dropping doesn't require a cascade there; the
--    column becomes "historical only" and will be cleaned up by Phase L
--    follow-up if we want).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.reflections CASCADE;

-- Leftover RLS policies referencing reflections are removed with the table.

-- ---------------------------------------------------------------------------
-- 7. Remove the pause_v2_enabled feature flag
-- ---------------------------------------------------------------------------
UPDATE public.app_config
   SET value = value - 'pause_v2_enabled',
       updated_at = now()
 WHERE key = 'feature_flags'
   AND value ? 'pause_v2_enabled';

-- ---------------------------------------------------------------------------
-- 8. Drop the cutover helper RPCs (no longer needed post-Phase L)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.cutover_flip_pause_v2(boolean);
DROP FUNCTION IF EXISTS public.cutover_reset_user_badges_baseline(boolean);

COMMIT;

-- ---------------------------------------------------------------------------
-- 9. Post-deletion verification (run outside the transaction)
-- ---------------------------------------------------------------------------
-- Should all return 0:
--
-- SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN
--   ('reflections','reflection_companions','pause_notifications');
-- SELECT count(*) FROM pg_views  WHERE schemaname='public' AND viewname IN
--   ('v_reflections_completed','v_reflections_engaged','v_reflection_with_companions','v_notification_response_rate');
-- SELECT count(*) FROM pg_proc   JOIN pg_namespace n ON n.oid=pronamespace
--   WHERE n.nspname='public' AND proname IN
--   ('notifications_from_reflections','notifications_from_pause_notifications',
--    'set_reflection_engaged_at','purge_orphan_notification_reflections',
--    'find_similar_reflection','cutover_flip_pause_v2',
--    'cutover_reset_user_badges_baseline');
-- SELECT count(*) FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='library_items' AND column_name='reflection_id';
-- SELECT value ? 'pause_v2_enabled' FROM app_config WHERE key='feature_flags';
