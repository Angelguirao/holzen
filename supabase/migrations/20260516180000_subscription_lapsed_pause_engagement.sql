-- §5.4: server-side pause engagement gate (trialing/active/lifetime only).

CREATE OR REPLACE FUNCTION public.user_can_engage_pause(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = p_user_id
      AND (
        p.lifetime_access IS TRUE
        OR p.subscription_status IN ('trialing', 'active')
      )
  );
$$;

COMMENT ON FUNCTION public.user_can_engage_pause(uuid) IS
  'True when user may start or continue an active pause ritual (lifetime, trialing, or active subscription).';

REVOKE ALL ON FUNCTION public.user_can_engage_pause(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_engage_pause(uuid) TO authenticated, service_role;

-- pause_log_step: block ritual steps on active/engaged when lapsed (service_role exempt).
CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid,
  p_step_type public.pause_step_type,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_outcome text;
  v_mood text;
  v_intensity text;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
  END IF;

  IF v_role <> 'service_role'
     AND v_inst.state IN ('active', 'engaged')
     AND NOT public.user_can_engage_pause(v_inst.user_id) THEN
    RAISE EXCEPTION 'pause_log_step: subscription required';
  END IF;

  IF v_inst.state = 'pending' THEN
    RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id;
  END IF;

  IF v_inst.state = 'expired' THEN
    IF p_step_type <> 'outcome_logged' THEN
      RETURN v_inst.state;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.pause_step_events e
      WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'outcome_logged'
    ) THEN
      RETURN v_inst.state;
    END IF;
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for retrospective outcome_logged', v_outcome;
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF v_inst.state = 'dismissed' THEN
    IF p_step_type <> 'outcome_logged' THEN
      RETURN v_inst.state;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.pause_step_events e
      WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'outcome_logged'
    ) THEN
      RETURN v_inst.state;
    END IF;
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for retrospective outcome_logged', v_outcome;
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF v_inst.state = 'completed' THEN
    IF p_step_type <> 'post_pause_emotion_logged' THEN
      RETURN v_inst.state;
    END IF;
    v_mood := lower(trim(COALESCE(p_payload->>'mood', '')));
    IF v_mood NOT IN ('calm', 'detached', 'uncertain', 'excited', 'anxious', 'fearful', 'greedy', 'fomo') THEN
      RAISE EXCEPTION 'pause_log_step: invalid mood % for post_pause_emotion_logged', v_mood;
    END IF;
    v_intensity := NULLIF(trim(both from COALESCE(p_payload->>'intensity', '')), '');
    IF v_intensity IS NOT NULL AND v_intensity !~ '^[1-5]$' THEN
      RAISE EXCEPTION 'pause_log_step: intensity for post_pause_emotion_logged must be 1–5';
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF p_step_type = 'ritual_depth_upgraded' THEN
    IF EXISTS (
      SELECT 1 FROM public.pause_step_events e
      WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'ritual_depth_upgraded'
    ) THEN
      RETURN v_inst.state;
    END IF;
    IF NOT public.pause_instance_is_brief_ritual(p_instance_id) THEN
      RAISE EXCEPTION 'pause_log_step: ritual_depth_upgraded requires brief_ritual on initial_emotion_logged';
    END IF;
    p_payload := COALESCE(p_payload, '{}'::jsonb)
      || jsonb_build_object('from', 'brief', 'to', 'deep');
  END IF;

  IF p_step_type = 'outcome_logged' THEN
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for outcome_logged', v_outcome;
    END IF;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

-- pause_create_or_reuse (authenticated): gate new instance creation only (reuse fingerprint still allowed for client redirect).
CREATE OR REPLACE FUNCTION public.pause_create_or_reuse(
  p_template_slug text,
  p_source text,
  p_context_snapshot jsonb,
  p_context_rule_result jsonb,
  p_context_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
  v_open_touched boolean;
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
   WHERE user_id = v_uid AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null
      );
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = v_open.id)
        OR EXISTS (SELECT 1 FROM public.pause_companion_events c WHERE c.pause_instance_id = v_open.id)
        OR (v_open.state = 'engaged')
      INTO v_open_touched;

    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'system_cancelled',
           terminal_at = v_now,
           metadata = metadata || jsonb_build_object('pending_offer_replaced', true)
     WHERE user_id = v_uid AND state = 'pending';

    IF NOT v_open_touched THEN
      IF NOT public.user_can_engage_pause(v_uid) THEN
        RAISE EXCEPTION 'pause_create_or_reuse: subscription required';
      END IF;

      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'superseded',
             terminal_at = v_now,
             metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_superseded_untouched_open', true)
       WHERE id = v_open.id;

      INSERT INTO public.pause_instances (
        user_id, template_id, state, source, context_snapshot, context_rule_result,
        context_fingerprint, window_starts_at, window_ends_at, superseded_by
      ) VALUES (
        v_uid, v_tpl.id, 'active', p_source,
        COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
        p_context_fingerprint, v_now, v_window_end, null
      ) RETURNING id INTO v_new_id;

      UPDATE public.pause_instances
         SET superseded_by = v_new_id
       WHERE id = v_open.id;

      RETURN jsonb_build_object(
        'instance_id', v_new_id,
        'created', true,
        'reused_reason', null,
        'pending_offer', false,
        'prior_open_instance_id', v_open.id
      );
    END IF;

    IF NOT public.user_can_engage_pause(v_uid) THEN
      RAISE EXCEPTION 'pause_create_or_reuse: subscription required';
    END IF;

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      v_uid, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, null,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = v_uid AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  IF NOT public.user_can_engage_pause(v_uid) THEN
    RAISE EXCEPTION 'pause_create_or_reuse: subscription required';
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, null
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', null,
    'pending_offer', false,
    'prior_open_instance_id', null
  );
END;
$$;
