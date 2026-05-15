-- Unified notifications feed for Home bell.
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
CREATE POLICY notifications_owner_select ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notifications_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_notifications_touch_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_touch_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_touch_updated_at();

CREATE OR REPLACE FUNCTION public.notifications_upsert(
  p_user_id uuid, p_type text, p_source_table text, p_source_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb, p_action_path text DEFAULT NULL,
  p_action_state jsonb DEFAULT NULL, p_created_at timestamptz DEFAULT now()
) RETURNS void LANGUAGE plpgsql SET search_path = public, auth, pg_temp AS $$
BEGIN
  IF p_user_id IS NULL OR p_source_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
  VALUES (p_user_id, p_type, p_source_table, p_source_id, COALESCE(p_metadata, '{}'::jsonb), p_action_path, p_action_state, COALESCE(p_created_at, now()))
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    type = EXCLUDED.type, metadata = EXCLUDED.metadata,
    action_path = EXCLUDED.action_path, action_state = EXCLUDED.action_state,
    created_at = EXCLUDED.created_at;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_user_badges()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'badge', 'user_badges', NEW.id,
    jsonb_build_object('badge_id', NEW.badge_id), '/profile',
    jsonb_build_object('tab', 'badges'), NEW.earned_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_night_reflections()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'night_reflection', 'night_reflections', NEW.id,
    jsonb_build_object('message', NEW.message), NULL, NULL, NEW.created_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, '/profile',
    jsonb_build_object('tab', 'letters', 'letterId', NEW.id::text), NEW.delivered_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'insight', 'reflection_insights', NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count),
    '/profile', jsonb_build_object('tab', 'insights'), NEW.generated_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflections()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'reflections', NEW.id,
    jsonb_build_object('message', NEW.message, 'context', NEW.context),
    '/pause', jsonb_build_object('reflectionId', NEW.id::text), NEW.created_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_pause_notifications()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reflection_id IS NOT NULL THEN
    DELETE FROM public.notifications
    WHERE source_table = 'reflections' AND source_id = NEW.reflection_id;
  END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'pause_notifications', NEW.id,
    jsonb_build_object('message', NEW.message, 'context', NEW.context, 'reflection_id', NEW.reflection_id),
    CASE WHEN NEW.reflection_id IS NOT NULL THEN '/pause' ELSE NULL END,
    CASE WHEN NEW.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', NEW.reflection_id::text) ELSE NULL END,
    NEW.created_at);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notifications_user_badges ON public.user_badges;
CREATE TRIGGER trg_notifications_user_badges AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.notifications_from_user_badges();

DROP TRIGGER IF EXISTS trg_notifications_night_reflections ON public.night_reflections;
CREATE TRIGGER trg_notifications_night_reflections AFTER INSERT ON public.night_reflections
  FOR EACH ROW EXECUTE FUNCTION public.notifications_from_night_reflections();

DROP TRIGGER IF EXISTS trg_notifications_future_letters ON public.future_letters;
CREATE TRIGGER trg_notifications_future_letters
  AFTER INSERT OR UPDATE OF delivered, delivered_at ON public.future_letters
  FOR EACH ROW EXECUTE FUNCTION public.notifications_from_future_letters();

DROP TRIGGER IF EXISTS trg_notifications_reflection_insights ON public.reflection_insights;
CREATE TRIGGER trg_notifications_reflection_insights AFTER INSERT ON public.reflection_insights
  FOR EACH ROW EXECUTE FUNCTION public.notifications_from_reflection_insights();

-- reflections table removed in pause V2 cutover (20260423202000); skip trigger + backfill when absent.
DO $notif_refl$
BEGIN
  IF to_regclass('public.reflections') IS NULL THEN
    RETURN;
  END IF;
  DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
  CREATE TRIGGER trg_notifications_reflections AFTER INSERT ON public.reflections
    FOR EACH ROW EXECUTE FUNCTION public.notifications_from_reflections();
END;
$notif_refl$;

-- pause_notifications dropped in pause V2 cutover; only attach trigger when table exists.
DO $notif_pn$
BEGIN
  IF to_regclass('public.pause_notifications') IS NULL THEN
    RETURN;
  END IF;
  DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;
  CREATE TRIGGER trg_notifications_pause_notifications AFTER INSERT ON public.pause_notifications
    FOR EACH ROW EXECUTE FUNCTION public.notifications_from_pause_notifications();
END;
$notif_pn$;

-- Backfill (with orphan filter)
INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT ub.user_id, 'badge', 'user_badges', ub.id,
  jsonb_build_object('badge_id', ub.badge_id), '/profile',
  jsonb_build_object('tab', 'badges'), ub.earned_at
FROM public.user_badges ub
WHERE ub.earned_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ub.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT nr.user_id, 'night_reflection', 'night_reflections', nr.id,
  jsonb_build_object('message', nr.message), NULL, NULL, nr.created_at
FROM public.night_reflections nr
WHERE nr.created_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = nr.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT fl.user_id, 'letter', 'future_letters', fl.id,
  '{}'::jsonb, '/profile',
  jsonb_build_object('tab', 'letters', 'letterId', fl.id::text), fl.delivered_at
FROM public.future_letters fl
WHERE fl.delivered IS TRUE AND fl.delivered_at IS NOT NULL
  AND fl.delivered_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = fl.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT ri.user_id, 'insight', 'reflection_insights', ri.id,
  jsonb_build_object('reflection_count', ri.reflection_count),
  '/profile', jsonb_build_object('tab', 'insights'), ri.generated_at
FROM public.reflection_insights ri
WHERE ri.generated_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ri.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

DO $backfill_refl$
BEGIN
  IF to_regclass('public.reflections') IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
  SELECT r.user_id, 'pause', 'reflections', r.id,
    jsonb_build_object('message', r.message, 'context', r.context),
    '/pause', jsonb_build_object('reflectionId', r.id::text), r.created_at
  FROM public.reflections r
  WHERE r.created_at >= now() - interval '30 days'
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id)
    AND (
      to_regclass('public.pause_notifications') IS NULL
      OR NOT EXISTS (SELECT 1 FROM public.pause_notifications pn WHERE pn.reflection_id = r.id)
    )
  ON CONFLICT (source_table, source_id) DO NOTHING;
END;
$backfill_refl$;

DO $backfill_pn$
BEGIN
  IF to_regclass('public.pause_notifications') IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
  SELECT pn.user_id, 'pause', 'pause_notifications', pn.id,
    jsonb_build_object('message', pn.message, 'context', pn.context, 'reflection_id', pn.reflection_id),
    CASE WHEN pn.reflection_id IS NOT NULL THEN '/pause' ELSE NULL END,
    CASE WHEN pn.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', pn.reflection_id::text) ELSE NULL END,
    pn.created_at
  FROM public.pause_notifications pn
  WHERE pn.created_at >= now() - interval '30 days'
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = pn.user_id)
  ON CONFLICT (source_table, source_id) DO NOTHING;
END;
$backfill_pn$;

DO $del_refl_notif$
BEGIN
  IF to_regclass('public.reflections') IS NULL OR to_regclass('public.pause_notifications') IS NULL THEN
    RETURN;
  END IF;
  DELETE FROM public.notifications n
  USING public.pause_notifications pn
  WHERE n.source_table = 'reflections'
    AND pn.reflection_id IS NOT NULL
    AND n.source_id = pn.reflection_id;
END;
$del_refl_notif$;

INSERT INTO public.app_config (key, value, description) VALUES
  ('budget_daily_usd_global', '60.0'::jsonb, 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'),
  ('budget_daily_usd_per_user', '2.5'::jsonb, 'Per-user AI spend cap per UTC day. Abuse backstop for runaway accounts.'),
  ('budget_monthly_usd_global', '1800.0'::jsonb, 'Global AI spend cap per UTC month.'),
  ('ai_cost_alert_daily_threshold_pct', '70'::jsonb, 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'),
  ('ai_cost_alert_wow_multiplier', '1.8'::jsonb, 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average.')
ON CONFLICT (key) DO NOTHING;

UPDATE public.app_config SET value = '60.0'::jsonb,
  description = 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'
WHERE key = 'budget_daily_usd_global' AND (value = '10'::jsonb OR value = '10.0'::jsonb);

UPDATE public.app_config SET value = '2.5'::jsonb,
  description = 'Per-user AI spend cap per UTC day. Abuse backstop for runaway accounts.'
WHERE key = 'budget_daily_usd_per_user' AND (value = '1'::jsonb OR value = '1.0'::jsonb);

UPDATE public.app_config SET value = '1800.0'::jsonb,
  description = 'Global AI spend cap per UTC month.'
WHERE key = 'budget_monthly_usd_global' AND (value = '300'::jsonb OR value = '300.0'::jsonb);

UPDATE public.app_config SET value = '70'::jsonb,
  description = 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'
WHERE key = 'ai_cost_alert_daily_threshold_pct' AND (value = '80'::jsonb OR value = '80.0'::jsonb);

UPDATE public.app_config SET value = '1.8'::jsonb,
  description = 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average.'
WHERE key = 'ai_cost_alert_wow_multiplier' AND (value = '2'::jsonb OR value = '2.0'::jsonb);

-- ============ Hardened claim_trigger_slot ============
CREATE OR REPLACE FUNCTION public.claim_trigger_slot(_user_id uuid, _cooldown_hours integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rows_affected integer;
  effective_cooldown_hours integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'claim_trigger_slot is restricted to service_role' USING ERRCODE = '42501';
  END IF;
  IF _user_id IS NULL THEN RETURN false; END IF;
  effective_cooldown_hours := LEAST(GREATEST(COALESCE(_cooldown_hours, 6), 1), 24);
  UPDATE public.profiles SET last_trigger_at = now()
  WHERE user_id = _user_id
    AND (last_trigger_at IS NULL OR last_trigger_at < now() - make_interval(hours => effective_cooldown_hours));
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END; $$;

REVOKE ALL ON FUNCTION public.claim_trigger_slot(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trigger_slot(uuid, integer) TO service_role;