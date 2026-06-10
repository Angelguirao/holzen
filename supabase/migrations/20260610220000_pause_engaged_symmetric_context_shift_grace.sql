-- Engaged open_max_age: symmetric 12h grace after any market context shift.
-- Anchors: metadata.calm_settled_at (calm sweep) and metadata.pending_offered_at (hot + pending).
-- Latest non-null anchor wins for expiry; engaged_at wall-clock removed for all sources.

CREATE OR REPLACE FUNCTION public.pause_open_max_anchor_at(
  p_source text,
  p_state public.pause_state,
  p_engaged_at timestamptz,
  p_created_at timestamptz,
  p_metadata jsonb
)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_state = 'engaged'::public.pause_state THEN (
      SELECT MAX(v)
        FROM (
          SELECT NULLIF(trim(both FROM COALESCE(p_metadata->>'calm_settled_at', '')), '')::timestamptz AS v
          UNION ALL
          SELECT NULLIF(trim(both FROM COALESCE(p_metadata->>'pending_offered_at', '')), '')::timestamptz
        ) anchors
       WHERE v IS NOT NULL
    )
    ELSE NULL::timestamptz
  END;
$$;

COMMENT ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) IS
  'open_max_age anchor for engaged rows: MAX(calm_settled_at, pending_offered_at). NULL until first context shift.';

REVOKE ALL ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public._pause_stamp_engaged_hot_context_shift(
  p_engaged_instance_id uuid,
  p_now timestamptz
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_engaged_instance_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.pause_instances
     SET metadata = (COALESCE(metadata, '{}'::jsonb) - 'calm_settled_at')
       || jsonb_build_object('pending_offered_at', to_jsonb(p_now))
   WHERE id = p_engaged_instance_id
     AND state = 'engaged';
END;
$$;

COMMENT ON FUNCTION public._pause_stamp_engaged_hot_context_shift(uuid, timestamptz) IS
  'Internal: hot context shift — clear calm_settled_at, stamp pending_offered_at on engaged row.';

REVOKE ALL ON FUNCTION public._pause_stamp_engaged_hot_context_shift(uuid, timestamptz) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._pause_cron_volatility_calm_sweep_core(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_n int := 0;
  v_row int;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION '_pause_cron_volatility_calm_sweep_core: p_user_id required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'context_lost',
         terminal_at = v_now,
         metadata = COALESCE(metadata, '{}'::jsonb)
           || jsonb_build_object('volatility_calm_sweep', true)
   WHERE user_id = p_user_id
     AND source = 'cron_volatility'
     AND state IN ('active', 'pending');
  GET DIAGNOSTICS v_row = ROW_COUNT;
  v_n := v_n + v_row;

  UPDATE public.pause_instances
     SET metadata = (COALESCE(metadata, '{}'::jsonb) - 'pending_offered_at')
       || CASE
            WHEN NOT (COALESCE(metadata, '{}'::jsonb) ? 'calm_settled_at') THEN
              jsonb_build_object('calm_settled_at', to_jsonb(v_now))
            ELSE '{}'::jsonb
          END
   WHERE user_id = p_user_id
     AND state = 'engaged';

  IF v_n > 0 AND NOT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = p_user_id
       AND pi.state IN ('active', 'engaged', 'pending')
  ) THEN
    UPDATE public.profiles
       SET last_context = NULL
     WHERE user_id = p_user_id;
  END IF;

  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public._pause_cron_volatility_calm_sweep_core(uuid) IS
  'Internal: expire cron active|pending on calm market; stamp calm_settled_at on all engaged rows (clear pending_offered_at).';

CREATE OR REPLACE FUNCTION public.pause_clear_cron_volatility_calm_settled(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n int := 0;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_clear_cron_volatility_calm_settled: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'pause_clear_cron_volatility_calm_settled: p_user_id required';
  END IF;

  UPDATE public.pause_instances
     SET metadata = COALESCE(metadata, '{}'::jsonb) - 'calm_settled_at'
   WHERE user_id = p_user_id
     AND state = 'engaged'
     AND metadata ? 'calm_settled_at';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public.pause_clear_cron_volatility_calm_settled(uuid) IS
  'Service-role: remove calm_settled_at from engaged rows when volatility is hot again (pending_offered_at set separately on pending create).';

CREATE OR REPLACE FUNCTION public.pause_apply_cron_calm_sweep_for_self(
  p_change_percent double precision,
  p_direction text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_threshold numeric;
  v_threshold_down numeric;
  v_effective numeric;
  v_expired int;
  v_calm_stamped boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_apply_cron_calm_sweep_for_self: not authenticated';
  END IF;

  IF p_direction IS NULL OR p_direction NOT IN ('up', 'down') THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_direction');
  END IF;

  IF p_change_percent IS NULL OR p_change_percent <> p_change_percent THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_change_percent');
  END IF;

  SELECT p.threshold, p.threshold_down
    INTO v_threshold, v_threshold_down
    FROM public.profiles p
   WHERE p.user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'profile_not_found');
  END IF;

  v_effective := CASE
    WHEN p_direction = 'down' THEN COALESCE(v_threshold_down, v_threshold, 5)
    ELSE COALESCE(v_threshold, 5)
  END;

  IF abs(p_change_percent) >= v_effective THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'market_not_calm');
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = v_uid
       AND (
         (pi.source = 'cron_volatility' AND pi.state IN ('active', 'pending'))
         OR pi.state = 'engaged'
       )
  ) THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_applicable_open_rows');
  END IF;

  v_expired := public._pause_cron_volatility_calm_sweep_core(v_uid);

  SELECT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = v_uid
       AND pi.state = 'engaged'
       AND COALESCE(pi.metadata, '{}'::jsonb) ? 'calm_settled_at'
  ) INTO v_calm_stamped;

  RETURN jsonb_build_object(
    'applied', true,
    'expired_count', v_expired,
    'calm_stamped', v_calm_stamped
  );
END;
$$;

COMMENT ON FUNCTION public.pause_apply_cron_calm_sweep_for_self(double precision, text) IS
  'Authenticated: calm sweep when live move is within thresholds — expire cron active|pending, stamp calm_settled_at on any engaged row.';

-- pause_create_or_reuse_as: stamp pending_offered_at when queuing pending behind engaged open pause.
CREATE OR REPLACE FUNCTION public.pause_create_or_reuse_as(
  p_user_id uuid,
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
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_pending public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
  v_open_touched boolean;
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
   WHERE user_id = p_user_id AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      UPDATE public.pause_instances
         SET context_snapshot = COALESCE(p_context_snapshot, '{}'::jsonb),
             context_rule_result = COALESCE(p_context_rule_result, '{}'::jsonb),
             metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object('context_refreshed_at', v_now)
       WHERE id = v_open.id;

      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null,
        'context_refreshed', true
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
     WHERE user_id = p_user_id AND state = 'pending';

    IF NOT v_open_touched THEN
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
        p_user_id, v_tpl.id, 'active', p_source,
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

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      p_user_id, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, NULL,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    IF v_open.state = 'engaged' THEN
      PERFORM public._pause_stamp_engaged_hot_context_shift(v_open.id, v_now);
    END IF;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  SELECT * INTO v_pending FROM public.pause_instances
   WHERE user_id = p_user_id AND state = 'pending'
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_pending.context_fingerprint = p_context_fingerprint THEN
      UPDATE public.pause_instances
         SET context_snapshot = COALESCE(p_context_snapshot, '{}'::jsonb),
             context_rule_result = COALESCE(p_context_rule_result, '{}'::jsonb),
             metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object('context_refreshed_at', v_now)
       WHERE id = v_pending.id;

      RETURN jsonb_build_object(
        'instance_id', v_pending.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', true, 'prior_open_instance_id', null,
        'context_refreshed', true
      );
    END IF;
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = p_user_id AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = p_user_id AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
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
  v_pending public.pause_instances%ROWTYPE;
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
      UPDATE public.pause_instances
         SET context_snapshot = COALESCE(p_context_snapshot, '{}'::jsonb),
             context_rule_result = COALESCE(p_context_rule_result, '{}'::jsonb),
             metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object('context_refreshed_at', v_now)
       WHERE id = v_open.id;

      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null,
        'context_refreshed', true
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

    IF v_open.state = 'engaged' THEN
      PERFORM public._pause_stamp_engaged_hot_context_shift(v_open.id, v_now);
    END IF;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  SELECT * INTO v_pending FROM public.pause_instances
   WHERE user_id = v_uid AND state = 'pending'
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_pending.context_fingerprint = p_context_fingerprint THEN
      UPDATE public.pause_instances
         SET context_snapshot = COALESCE(p_context_snapshot, '{}'::jsonb),
             context_rule_result = COALESCE(p_context_rule_result, '{}'::jsonb),
             metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object('context_refreshed_at', v_now)
       WHERE id = v_pending.id;

      RETURN jsonb_build_object(
        'instance_id', v_pending.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', true, 'prior_open_instance_id', null,
        'context_refreshed', true
      );
    END IF;
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

COMMENT ON FUNCTION public.pause_evaluate_transitions(uuid) IS
  'volatility_v1: deep engaged after reflection_step; completed requires outcome_logged + ritual beats. '
  'open_max_age: engaged rows 12h after MAX(calm_settled_at, pending_offered_at). '
  'When open_max expires engaged with a pending row, pending is promoted to active.';
