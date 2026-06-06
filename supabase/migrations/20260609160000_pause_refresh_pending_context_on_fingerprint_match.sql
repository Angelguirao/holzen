-- Refresh context_snapshot on pending cron offers when the fingerprint band is unchanged
-- (mirrors active|engaged refresh from 20260609150000).

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
