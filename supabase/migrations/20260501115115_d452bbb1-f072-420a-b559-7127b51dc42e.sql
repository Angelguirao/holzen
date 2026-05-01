-- Apply pending repo migrations to DB.

-- =========================================================================
-- 20260425200000_journey_routes_notification_paths.sql
-- =========================================================================
SET search_path = public;

CREATE OR REPLACE FUNCTION public.notifications_from_user_badges() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'badge', 'user_badges', NEW.id,
    jsonb_build_object('badge_id', NEW.badge_id), '/journey/badges', NULL, NEW.earned_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, format('/tools/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'insight', 'reflection_insights', NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count), '/journey/insights', NULL, NEW.generated_at);
  RETURN NEW;
END; $$;

UPDATE public.notifications SET action_path = '/journey/badges', action_state = NULL
 WHERE type = 'badge' AND action_path = '/profile';

UPDATE public.notifications SET action_path = '/journey/insights', action_state = NULL
 WHERE type = 'insight' AND action_path = '/profile';

UPDATE public.notifications
   SET action_path = format('/tools/letters?letter=%s', source_id::text), action_state = NULL
 WHERE type = 'letter' AND action_path = '/profile' AND source_table = 'future_letters';

-- =========================================================================
-- 20260426010000_letters_tools_action_path.sql
-- =========================================================================
CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, format('/tools/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

UPDATE public.notifications
   SET action_path = format('/tools/letters?letter=%s', source_id::text), action_state = NULL
 WHERE type = 'letter' AND source_table = 'future_letters' AND action_path LIKE '/journey/letters%';

-- =========================================================================
-- 20260426082753 — admin migration status RPC
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_applied_migrations(p_limit integer DEFAULT 20)
RETURNS TABLE(version text, name text, statements_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, supabase_migrations
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT m.version::text,
         COALESCE(m.name, '')::text AS name,
         COALESCE(array_length(m.statements, 1), 0)::integer AS statements_count
  FROM supabase_migrations.schema_migrations m
  ORDER BY m.version DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_applied_migrations(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_applied_migrations(integer) TO authenticated;

-- =========================================================================
-- 20260426084601 — practice_entries.pause_instance_id (initial add)
-- =========================================================================
ALTER TABLE public.practice_entries
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_practice_entries_pause_instance_id
  ON public.practice_entries(pause_instance_id)
  WHERE pause_instance_id IS NOT NULL;

-- =========================================================================
-- 20260426120000 — practice_entries pause_instance_id RLS + index for replays
-- =========================================================================
COMMENT ON COLUMN public.practice_entries.pause_instance_id IS
  'Optional link to a pause instance (required for type=replay thread; null for standalone check-in/journal/bodyscan).';

CREATE INDEX IF NOT EXISTS idx_practice_entries_user_pause_replay
  ON public.practice_entries (user_id, pause_instance_id)
  WHERE type = 'replay' AND pause_instance_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own practice entries" ON public.practice_entries;

CREATE POLICY "Users can insert own practice entries"
  ON public.practice_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      pause_instance_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.pause_instances pi
        WHERE pi.id = pause_instance_id
          AND pi.user_id = auth.uid()
      )
    )
  );

-- =========================================================================
-- 20260426200000 — library_items source_type rename
-- =========================================================================
UPDATE public.library_items SET source_type = 'pause' WHERE source_type = 'reflection';
UPDATE public.library_items SET source_type = 'pause_note' WHERE source_type = 'reflection_note';

-- =========================================================================
-- 20260501120000 — pause action window optional + dismissal suppression split
-- =========================================================================
ALTER TABLE public.pause_templates
  ADD COLUMN IF NOT EXISTS action_window_ms bigint NULL,
  ADD COLUMN IF NOT EXISTS dismissal_suppression_ms bigint NOT NULL DEFAULT 21600000;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'pause_templates_dismissal_suppression_positive'
  ) THEN
    ALTER TABLE public.pause_templates
      ADD CONSTRAINT pause_templates_dismissal_suppression_positive
      CHECK (dismissal_suppression_ms > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.pause_templates.action_window_ms IS
  'When set, pause_instances.window_ends_at = created + this duration and the '
  'transition engine may expire with window_elapsed. When NULL, window_ends_at '
  'is set far in the future so only non-clock rules end the pause.';

COMMENT ON COLUMN public.pause_templates.dismissal_suppression_ms IS
  'Lookback for pause_create_or_reuse recent_dismissal: same fingerprint '
  'dismissed/expired within this window blocks a new instance.';

UPDATE public.pause_templates SET dismissal_suppression_ms = window_ms;
UPDATE public.pause_templates SET action_window_ms = window_ms;
UPDATE public.pause_templates SET action_window_ms = NULL WHERE slug = 'volatility_v1';

UPDATE public.pause_instances pi
   SET window_ends_at = now() + interval '100 years'
  FROM public.pause_templates t
 WHERE pi.template_id = t.id
   AND t.action_window_ms IS NULL
   AND pi.state IN ('active', 'engaged');

CREATE OR REPLACE FUNCTION public.pause_create_or_reuse_as(
  p_user_id uuid, p_template_slug text, p_source text,
  p_context_snapshot jsonb, p_context_rule_result jsonb, p_context_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'pause_create_or_reuse_as: service_role required'; END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'pause_create_or_reuse_as: p_user_id required'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse_as: unknown or inactive template slug %', p_template_slug; END IF;

  IF v_tpl.action_window_ms IS NULL THEN
    v_window_end := v_now + interval '100 years';
  ELSE
    v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0);
  END IF;

  SELECT * INTO v_open FROM public.pause_instances
   WHERE user_id = p_user_id AND state IN ('active','engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match');
    ELSE
      UPDATE public.pause_instances SET state='expired', expired_reason='context_lost', terminal_at=v_now WHERE id=v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss FROM public.pause_instances
     WHERE user_id = p_user_id AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
     ORDER BY terminal_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('instance_id', NULL, 'created', false, 'reused_reason', 'recent_dismissal');
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, NULL
  ) RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_create_or_reuse(
  p_template_slug text, p_source text,
  p_context_snapshot jsonb, p_context_rule_result jsonb, p_context_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_create_or_reuse: authenticated user required (use pause_create_or_reuse_as for service_role)';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug; END IF;

  IF v_tpl.action_window_ms IS NULL THEN
    v_window_end := v_now + interval '100 years';
  ELSE
    v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0);
  END IF;

  SELECT * INTO v_open FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('active','engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match');
    ELSE
      UPDATE public.pause_instances SET state='expired', expired_reason='context_lost', terminal_at=v_now WHERE id=v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss FROM public.pause_instances
     WHERE user_id = v_uid AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
     ORDER BY terminal_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('instance_id', NULL, 'created', false, 'reused_reason', 'recent_dismissal');
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, NULL
  ) RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', NULL);
END;
$$;
