-- When engaged open_max_age expires and a pending offer exists, promote pending → active
-- (same handoff as Home Discard, without user action). Shared helper also DRYs dismiss_current.

CREATE OR REPLACE FUNCTION public.pause_promote_pending_for_user(
  p_user_id uuid,
  p_reason_key text,
  p_now timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending public.pause_instances%ROWTYPE;
  v_msg text;
BEGIN
  IF p_user_id IS NULL OR p_reason_key IS NULL OR length(trim(p_reason_key)) = 0 THEN
    RETURN false;
  END IF;

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = p_user_id
     AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.pause_instances
     SET state = 'active',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(p_reason_key, p_now)
   WHERE id = v_pending.id;

  SELECT content->>'message'
    INTO v_msg
    FROM public.pause_ai_artifacts
   WHERE pause_instance_id = v_pending.id
     AND kind = 'reflection_text'
   LIMIT 1;

  INSERT INTO public.library_items (
    user_id, type, title, body, source_type, pause_instance_id, tags, pinned, is_favorite
  )
  SELECT
    v_pending.user_id,
    'bookmark',
    'Pause',
    COALESCE(v_msg, ''),
    'pause',
    v_pending.id,
    ARRAY[]::text[],
    false,
    false
  WHERE NOT EXISTS (
    SELECT 1
      FROM public.library_items li
     WHERE li.user_id = v_pending.user_id
       AND li.pause_instance_id = v_pending.id
       AND li.source_type = 'pause'
       AND li.status IS DISTINCT FROM 'deleted'
       AND li.status IS DISTINCT FROM 'archived'
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) IS
  'Promote the user''s pending pause row to active (optional library bookmark). Used after open_max expiry and from pause_dismiss_current.';

REVOKE ALL ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) TO authenticated, service_role;

-- DRY: pause_dismiss_current pending promotion
CREATE OR REPLACE FUNCTION public.pause_dismiss_current()
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_open_id uuid;
  v_pending public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
  v_out public.pause_state;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_dismiss_current: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT id INTO v_open_id
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active', 'engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_open_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');
    PERFORM public.pause_promote_pending_for_user(
      v_uid,
      'pending_promoted_on_dismiss_current',
      v_now
    );
    RETURN v_out;
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('cleared_with_dismiss_current', true)
   WHERE user_id = v_uid
     AND state = 'pending';

  v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');
  RETURN v_out;
END;
$$;

-- open_max_age on engaged: expire row, then promote pending when queued.
CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_tpl  public.pause_templates%ROWTYPE;
  v_step_types text[];
  v_counted_count int;
  v_engaged_ok boolean;
  v_completed_ok boolean;
  v_brief_mode boolean;
  v_now timestamptz := now();
  v_open_max_anchor timestamptz;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_inst.state IN ('completed', 'dismissed', 'expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN RETURN 'pending'; END IF;

  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances
       SET state = 'expired', expired_reason = 'window_elapsed', terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'expired';
  END IF;

  v_open_max_anchor := public.pause_open_max_anchor_at(
    v_inst.source::text,
    v_inst.state,
    v_inst.engaged_at,
    v_inst.created_at,
    COALESCE(v_inst.metadata, '{}'::jsonb)
  );

  IF v_inst.state = 'engaged'
     AND v_open_max_anchor IS NOT NULL
     AND v_open_max_anchor <= v_now - interval '12 hours' THEN
    UPDATE public.pause_instances
       SET state = 'expired', expired_reason = 'open_max_age', terminal_at = v_now
     WHERE id = p_instance_id;
    PERFORM public.pause_promote_pending_for_user(
      v_inst.user_id,
      'pending_promoted_on_open_max_age',
      v_now
    );
    RETURN 'expired';
  END IF;

  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;

  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[])
    INTO v_step_types
    FROM public.pause_step_events
   WHERE pause_instance_id = p_instance_id;

  SELECT count(*) INTO v_counted_count
    FROM public.pause_companion_events
   WHERE pause_instance_id = p_instance_id
     AND action = 'complete'
     AND counts_for_pause = true;

  v_brief_mode := public.pause_instance_is_brief_ritual(p_instance_id);

  IF v_tpl.slug = 'volatility_v1' THEN
    v_engaged_ok :=
      NOT v_brief_mode
      AND ARRAY['reflection_step']::text[] <@ v_step_types;
    v_completed_ok :=
      ARRAY['outcome_logged']::text[] <@ v_step_types
      AND public.pause_volatility_v1_ritual_beats_met(p_instance_id);
  ELSE
    v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
    v_completed_ok :=
      (v_tpl.required_for_completed <@ v_step_types)
      AND (v_counted_count >= v_tpl.required_companion_count);
  END IF;

  IF v_completed_ok THEN
    UPDATE public.pause_instances
       SET state = 'completed',
           completed_at = COALESCE(completed_at, v_now),
           engaged_at = COALESCE(engaged_at, v_now),
           terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'completed';
  END IF;

  IF v_engaged_ok AND v_inst.state = 'active' THEN
    UPDATE public.pause_instances
       SET state = 'engaged', engaged_at = COALESCE(engaged_at, v_now)
     WHERE id = p_instance_id;
    RETURN 'engaged';
  END IF;

  RETURN v_inst.state;
END;
$$;

COMMENT ON FUNCTION public.pause_evaluate_transitions(uuid) IS
  'volatility_v1: deep engaged after reflection_step; completed requires outcome_logged + ritual beats. '
  'open_max_age: engaged cron rows 12h after metadata.calm_settled_at; other engaged 12h after COALESCE(engaged_at, created_at). '
  'When open_max expires engaged with a pending row, pending is promoted to active.';

CREATE OR REPLACE FUNCTION public.pause_sweep_window_elapsed()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_total integer := 0;
  v_n integer;
  v_rec record;
BEGIN
  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active', 'engaged')
       AND window_ends_at <= v_now
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'window_elapsed',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  FOR v_rec IN
    SELECT pi.id, pi.user_id
      FROM public.pause_instances pi
     WHERE pi.state = 'engaged'
       AND public.pause_open_max_anchor_at(
         pi.source::text,
         pi.state,
         pi.engaged_at,
         pi.created_at,
         COALESCE(pi.metadata, '{}'::jsonb)
       ) IS NOT NULL
       AND public.pause_open_max_anchor_at(
         pi.source::text,
         pi.state,
         pi.engaged_at,
         pi.created_at,
         COALESCE(pi.metadata, '{}'::jsonb)
       ) <= v_now - interval '12 hours'
     FOR UPDATE OF pi SKIP LOCKED
  LOOP
    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'open_max_age',
           terminal_at = v_now
     WHERE id = v_rec.id;

    v_total := v_total + 1;

    PERFORM public.pause_promote_pending_for_user(
      v_rec.user_id,
      'pending_promoted_on_open_max_age',
      v_now
    );
  END LOOP;

  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state = 'pending'
       AND created_at <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = COALESCE(pi.metadata, '{}'::jsonb) || jsonb_build_object('pending_stale_ttl', true)
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION public.pause_sweep_window_elapsed() IS
  'Batch expire window_elapsed, engaged open_max_age (promote pending per user when queued), pending stale TTL.';
