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
ALTER TABLE public.library_items
  DROP CONSTRAINT IF EXISTS library_items_user_id_reflection_id_source_type_key;
DROP INDEX IF EXISTS public.idx_library_items_reflection_id;
DROP INDEX IF EXISTS public.library_items_user_id_reflection_id_source_type_key;
ALTER TABLE public.library_items DROP COLUMN IF EXISTS reflection_id;

ALTER TABLE public.practice_entries DROP COLUMN IF EXISTS source_reflection_id;

ALTER TABLE public.ritual_completions DROP COLUMN IF EXISTS reflection_id;

ALTER TABLE public.companion_serves DROP COLUMN IF EXISTS reflection_id;

ALTER TABLE public.generation_attempts DROP COLUMN IF EXISTS reflection_id;

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
-- ---------------------------------------------------------------------------
TRUNCATE public.user_badges RESTART IDENTITY;

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
