-- Unified notifications feed for Home bell.
-- Consolidates multiple source tables into one query/realtime surface.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('badge', 'night_reflection', 'letter', 'insight', 'pause')),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_path text,
  action_state jsonb,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_source_unique UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read_at)
  WHERE dismissed_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_owner_select ON public.notifications;
CREATE POLICY notifications_owner_select
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notifications_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_touch_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_touch_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_touch_updated_at();

CREATE OR REPLACE FUNCTION public.notifications_upsert(
  p_user_id uuid,
  p_type text,
  p_source_table text,
  p_source_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_action_path text DEFAULT NULL,
  p_action_state jsonb DEFAULT NULL,
  p_created_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_source_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    source_table,
    source_id,
    metadata,
    action_path,
    action_state,
    created_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_source_table,
    p_source_id,
    COALESCE(p_metadata, '{}'::jsonb),
    p_action_path,
    p_action_state,
    COALESCE(p_created_at, now())
  )
  ON CONFLICT (source_table, source_id)
  DO UPDATE SET
    type = EXCLUDED.type,
    metadata = EXCLUDED.metadata,
    action_path = EXCLUDED.action_path,
    action_state = EXCLUDED.action_state,
    created_at = EXCLUDED.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_user_badges()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.notifications_upsert(
    NEW.user_id,
    'badge',
    'user_badges',
    NEW.id,
    jsonb_build_object('badge_id', NEW.badge_id),
    '/profile',
    jsonb_build_object('tab', 'badges'),
    NEW.earned_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_night_reflections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.notifications_upsert(
    NEW.user_id,
    'night_reflection',
    'night_reflections',
    NEW.id,
    jsonb_build_object('message', NEW.message),
    NULL,
    NULL,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.notifications_upsert(
    NEW.user_id,
    'letter',
    'future_letters',
    NEW.id,
    '{}'::jsonb,
    '/profile',
    jsonb_build_object('tab', 'letters', 'letterId', NEW.id::text),
    NEW.delivered_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.notifications_upsert(
    NEW.user_id,
    'insight',
    'reflection_insights',
    NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count),
    '/profile',
    jsonb_build_object('tab', 'insights'),
    NEW.generated_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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
BEGIN
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

DROP TRIGGER IF EXISTS trg_notifications_user_badges ON public.user_badges;
CREATE TRIGGER trg_notifications_user_badges
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_user_badges();

DROP TRIGGER IF EXISTS trg_notifications_night_reflections ON public.night_reflections;
CREATE TRIGGER trg_notifications_night_reflections
  AFTER INSERT ON public.night_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_night_reflections();

DROP TRIGGER IF EXISTS trg_notifications_future_letters ON public.future_letters;
CREATE TRIGGER trg_notifications_future_letters
  AFTER INSERT OR UPDATE OF delivered, delivered_at ON public.future_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_future_letters();

DROP TRIGGER IF EXISTS trg_notifications_reflection_insights ON public.reflection_insights;
CREATE TRIGGER trg_notifications_reflection_insights
  AFTER INSERT ON public.reflection_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_reflection_insights();

DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
CREATE TRIGGER trg_notifications_reflections
  AFTER INSERT ON public.reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_reflections();

DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;
CREATE TRIGGER trg_notifications_pause_notifications
  AFTER INSERT ON public.pause_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_pause_notifications();

-- Backfill a bounded recent history so existing users immediately see bell entries.
INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  ub.user_id,
  'badge',
  'user_badges',
  ub.id,
  jsonb_build_object('badge_id', ub.badge_id),
  '/profile',
  jsonb_build_object('tab', 'badges'),
  ub.earned_at
FROM public.user_badges ub
WHERE ub.earned_at >= now() - interval '30 days'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  nr.user_id,
  'night_reflection',
  'night_reflections',
  nr.id,
  jsonb_build_object('message', nr.message),
  NULL,
  NULL,
  nr.created_at
FROM public.night_reflections nr
WHERE nr.created_at >= now() - interval '30 days'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  fl.user_id,
  'letter',
  'future_letters',
  fl.id,
  '{}'::jsonb,
  '/profile',
  jsonb_build_object('tab', 'letters', 'letterId', fl.id::text),
  fl.delivered_at
FROM public.future_letters fl
WHERE fl.delivered IS TRUE
  AND fl.delivered_at IS NOT NULL
  AND fl.delivered_at >= now() - interval '30 days'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  ri.user_id,
  'insight',
  'reflection_insights',
  ri.id,
  jsonb_build_object('reflection_count', ri.reflection_count),
  '/profile',
  jsonb_build_object('tab', 'insights'),
  ri.generated_at
FROM public.reflection_insights ri
WHERE ri.generated_at >= now() - interval '30 days'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  r.user_id,
  'pause',
  'reflections',
  r.id,
  jsonb_build_object('message', r.message, 'context', r.context),
  '/pause',
  jsonb_build_object('reflectionId', r.id::text),
  r.created_at
FROM public.reflections r
WHERE r.created_at >= now() - interval '30 days'
  AND NOT EXISTS (
    SELECT 1
    FROM public.pause_notifications pn
    WHERE pn.reflection_id = r.id
  )
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id, type, source_table, source_id, metadata, action_path, action_state, created_at
)
SELECT
  pn.user_id,
  'pause',
  'pause_notifications',
  pn.id,
  jsonb_build_object(
    'message', pn.message,
    'context', pn.context,
    'reflection_id', pn.reflection_id
  ),
  CASE
    WHEN pn.reflection_id IS NOT NULL THEN '/pause'
    ELSE NULL
  END,
  CASE
    WHEN pn.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', pn.reflection_id::text)
    ELSE NULL
  END,
  pn.created_at
FROM public.pause_notifications pn
WHERE pn.created_at >= now() - interval '30 days'
ON CONFLICT (source_table, source_id) DO NOTHING;

-- Ensure explicit pause_notifications own the row when both sources exist.
DELETE FROM public.notifications n
USING public.pause_notifications pn
WHERE n.source_table = 'reflections'
  AND pn.reflection_id IS NOT NULL
  AND n.source_id = pn.reflection_id;
