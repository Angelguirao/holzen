-- ============================================================================
-- Pause V2 — Phase F: notifications trigger + library_items.pause_instance_id
--
-- Two independent changes shipped together because both unlock the Bell +
-- Library surfaces in the UI:
--
-- 1. A new trigger `notifications_from_pause_instances` that fans
--    pause_instance lifecycle into the unified `notifications` feed.
--    * INSERT with state='active' -> upsert a 'pause' notification.
--    * UPDATE from active|engaged to any terminal state -> stamp
--      `dismissed_at = now()` so the bell clears the card.
--    * When the same user has a legacy-reflection 'pause' notification
--      for the reflection row we already covered, drop it in favour of
--      the instance-based row (the instance is richer + carries the
--      correct action_path).
--
-- 2. `library_items.pause_instance_id` column + FK + partial index.
--    Written in parallel by the edge + hook dual-write paths in later
--    commits. During cutover both `reflection_id` and `pause_instance_id`
--    may be populated on the same row; Phase L drops `reflection_id`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1a. Notification trigger: INSERT -> upsert, UPDATE to terminal -> dismiss
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notifications_from_pause_instances()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_action_state jsonb;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.state = 'active' THEN
    v_action_state := jsonb_build_object('pauseInstanceId', NEW.id::text);

    PERFORM public.notifications_upsert(
      NEW.user_id,
      'pause',
      'pause_instances',
      NEW.id,
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at
      ),
      '/pause',
      v_action_state,
      NEW.created_at
    );

    -- Supersede any legacy reflection-scoped pause notification for this user
    -- that was emitted in the same tick (cron path writes both during cutover).
    -- Looks back a minute to be safe against trigger-ordering races.
    DELETE FROM public.notifications
     WHERE user_id = NEW.user_id
       AND type = 'pause'
       AND source_table IN ('reflections','pause_notifications')
       AND created_at >= NEW.created_at - interval '1 minute';

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.state IN ('active','engaged')
     AND NEW.state IN ('completed','dismissed','expired') THEN
    UPDATE public.notifications
       SET dismissed_at = now()
     WHERE source_table = 'pause_instances'
       AND source_id = NEW.id
       AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_pause_instances ON public.pause_instances;
CREATE TRIGGER trg_notifications_pause_instances
  AFTER INSERT OR UPDATE OF state ON public.pause_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_pause_instances();

-- ---------------------------------------------------------------------------
-- 1b. Teach the existing legacy triggers to skip when V2 is on.
--
-- Without this, cron would emit two 'pause' notifications (one from the
-- reflections trigger, one from the pause_instances trigger). The
-- pause_instances trigger already deletes "recent" legacy pauses, but the
-- net feel is better if the legacy path simply doesn't emit while V2 is on.
--
-- We check app_config.feature_flags.pause_v2_enabled inline. Reads are
-- cheap (single-row jsonb). Legacy surfaces (manual flow pre-cutover,
-- Phase G stats) still work regardless because they read the
-- notifications table, not reflections.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notifications_from_reflections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pause_v2_enabled boolean;
BEGIN
  SELECT COALESCE((value->>'pause_v2_enabled')::boolean, false)
    INTO v_pause_v2_enabled
    FROM public.app_config
   WHERE key = 'feature_flags'
   LIMIT 1;

  IF v_pause_v2_enabled IS TRUE THEN
    -- V2 is authoritative: the pause_instances trigger will emit the
    -- right notification. Skipping here keeps the bell clean.
    RETURN NEW;
  END IF;

  PERFORM public.notifications_upsert(
    NEW.user_id,
    'pause',
    'reflections',
    NEW.id,
    jsonb_build_object('message', NEW.message, 'context', NEW.context),
    '/pause',
    jsonb_build_object('reflectionId', NEW.id::text),
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_pause_notifications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pause_v2_enabled boolean;
BEGIN
  SELECT COALESCE((value->>'pause_v2_enabled')::boolean, false)
    INTO v_pause_v2_enabled
    FROM public.app_config
   WHERE key = 'feature_flags'
   LIMIT 1;

  IF v_pause_v2_enabled IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Prefer the richer explicit pause_notifications row over generic reflection rows.
  IF NEW.reflection_id IS NOT NULL THEN
    DELETE FROM public.notifications
    WHERE source_table = 'reflections'
      AND source_id = NEW.reflection_id;
  END IF;

  PERFORM public.notifications_upsert(
    NEW.user_id,
    'pause',
    'pause_notifications',
    NEW.id,
    jsonb_build_object(
      'message', NEW.message,
      'context', NEW.context,
      'reflection_id', NEW.reflection_id
    ),
    CASE
      WHEN NEW.reflection_id IS NOT NULL THEN '/pause'
      ELSE NULL
    END,
    CASE
      WHEN NEW.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', NEW.reflection_id::text)
      ELSE NULL
    END,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. library_items.pause_instance_id
-- ---------------------------------------------------------------------------
-- Column + FK + unique-per-(user, pause, source_type) index aligned with the
-- existing onConflict shape using reflection_id. Dual keys coexist until
-- Phase L drops the legacy reflection_id column.

ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_library_items_pause_instance
  ON public.library_items (pause_instance_id)
  WHERE pause_instance_id IS NOT NULL;

-- Mirror the existing (user_id, reflection_id, source_type) unique index for
-- the pause_instance key. We want to keep the legacy unique constraint live
-- during cutover so existing upsert paths aren't disturbed; this new one is
-- additional.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_library_items_user_pause_source
  ON public.library_items (user_id, pause_instance_id, source_type)
  WHERE pause_instance_id IS NOT NULL;

COMMENT ON COLUMN public.library_items.pause_instance_id IS
  'Pause V2 home for this library item. Set alongside reflection_id during '
  'the cutover; reflection_id is dropped in Phase L. See docs/systems/pause-system.md.';
