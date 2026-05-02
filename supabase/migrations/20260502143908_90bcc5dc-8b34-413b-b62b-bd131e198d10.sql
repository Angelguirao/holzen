-- 2) Table constraints
ALTER TABLE public.pause_instances DROP CONSTRAINT IF EXISTS pause_instances_terminal_ts;
ALTER TABLE public.pause_instances
  ADD CONSTRAINT pause_instances_terminal_ts CHECK (
    (state IN ('completed', 'dismissed', 'expired') AND terminal_at IS NOT NULL)
    OR (state IN ('active', 'engaged', 'pending') AND terminal_at IS NULL)
  );

ALTER TABLE public.pause_instances DROP CONSTRAINT IF EXISTS pause_instances_pending_shape;
ALTER TABLE public.pause_instances
  ADD CONSTRAINT pause_instances_pending_shape CHECK (
    state <> 'pending'
    OR (engaged_at IS NULL AND completed_at IS NULL AND terminal_at IS NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pause_pending_per_user
  ON public.pause_instances (user_id)
  WHERE state = 'pending';

CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_tpl  public.pause_templates%ROWTYPE;
  v_step_types text[];
  v_counted_count int;
  v_engaged_ok boolean;
  v_completed_ok boolean;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_inst.state IN ('completed', 'dismissed', 'expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN RETURN 'pending'; END IF;
  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances SET state = 'expired', expired_reason = 'window_elapsed', terminal_at = v_now WHERE id = p_instance_id;
    RETURN 'expired';
  END IF;
  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;
  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[]) INTO v_step_types
    FROM public.pause_step_events WHERE pause_instance_id = p_instance_id;
  SELECT count(*) INTO v_counted_count FROM public.pause_companion_events
    WHERE pause_instance_id = p_instance_id AND action = 'complete' AND counts_for_pause = true;
  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  v_completed_ok := (v_tpl.required_for_completed <@ v_step_types) AND (v_counted_count >= v_tpl.required_companion_count);
  IF v_completed_ok THEN
    UPDATE public.pause_instances SET state = 'completed', completed_at = COALESCE(completed_at, v_now), engaged_at = COALESCE(engaged_at, v_now), terminal_at = v_now WHERE id = p_instance_id;
    RETURN 'completed';
  END IF;
  IF v_engaged_ok AND v_inst.state = 'active' THEN
    UPDATE public.pause_instances SET state = 'engaged', engaged_at = COALESCE(engaged_at, v_now) WHERE id = p_instance_id;
    RETURN 'engaged';
  END IF;
  RETURN v_inst.state;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid, p_step_type public.pause_step_type, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_uid uuid := auth.uid();
  v_role text := auth.role();
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN RAISE EXCEPTION 'pause_log_step: not authorized'; END IF;
  IF v_inst.state IN ('completed', 'dismissed', 'expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN
    RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id;
  END IF;
  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_log_companion(
  p_instance_id uuid, p_companion_type text, p_action public.pause_companion_action, p_entry_point text
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_role text := auth.role();
  v_effective_user_id uuid;
  v_inst public.pause_instances%ROWTYPE;
  v_tpl public.pause_templates%ROWTYPE;
  v_counts boolean := false; v_reason text := NULL;
  v_now timestamptz := now(); v_state public.pause_state; v_inserted_id uuid;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN RAISE EXCEPTION 'pause_log_companion: not authorized'; END IF;
  IF p_instance_id IS NOT NULL THEN
    SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_companion: instance % not found', p_instance_id; END IF;
    IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN RAISE EXCEPTION 'pause_log_companion: not authorized'; END IF;
    v_effective_user_id := v_inst.user_id;
  ELSE
    IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_log_companion: need instance id when invoked as service_role'; END IF;
    v_effective_user_id := v_uid;
  END IF;
  IF p_action = 'complete' AND p_instance_id IS NOT NULL THEN
    IF v_inst.state NOT IN ('active', 'engaged') THEN
      v_reason := CASE v_inst.state
        WHEN 'pending' THEN 'no_active_pause' WHEN 'completed' THEN 'no_active_pause' WHEN 'dismissed' THEN 'no_active_pause'
        WHEN 'expired' THEN CASE v_inst.expired_reason::text WHEN 'context_lost' THEN 'context_lost' WHEN 'window_elapsed' THEN 'outside_window' ELSE 'no_active_pause' END
        ELSE 'no_active_pause' END;
    ELSIF v_inst.window_ends_at <= v_now THEN v_reason := 'outside_window';
    ELSE
      SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
      IF p_companion_type <> ALL (v_tpl.allowed_companion_types) THEN v_reason := 'not_allowed_for_template';
      ELSE v_counts := true; END IF;
    END IF;
  ELSIF p_action = 'complete' AND p_instance_id IS NULL THEN v_reason := 'no_active_pause';
  END IF;
  IF v_counts THEN
    INSERT INTO public.pause_companion_events (pause_instance_id, user_id, companion_type, action, entry_point, counts_for_pause, non_counting_reason)
    VALUES (p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, true, NULL)
    ON CONFLICT (pause_instance_id, companion_type) WHERE action = 'complete' AND counts_for_pause = true DO NOTHING
    RETURNING id INTO v_inserted_id;
    IF v_inserted_id IS NULL THEN
      v_counts := false; v_reason := 'already_counted';
      INSERT INTO public.pause_companion_events (pause_instance_id, user_id, companion_type, action, entry_point, counts_for_pause, non_counting_reason)
      VALUES (p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, false, v_reason);
    END IF;
  ELSE
    INSERT INTO public.pause_companion_events (pause_instance_id, user_id, companion_type, action, entry_point, counts_for_pause, non_counting_reason)
    VALUES (p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, false, v_reason);
  END IF;
  IF p_instance_id IS NOT NULL THEN SELECT state INTO v_state FROM public.pause_instances WHERE id = p_instance_id; END IF;
  RETURN jsonb_build_object('counts_for_pause', v_counts, 'non_counting_reason', v_reason, 'resulting_state', v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_create_or_reuse_as(
  p_user_id uuid, p_template_slug text, p_source text, p_context_snapshot jsonb, p_context_rule_result jsonb, p_context_fingerprint text
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tpl public.pause_templates%ROWTYPE; v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE; v_new_id uuid;
  v_now timestamptz := now(); v_window_end timestamptz;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'pause_create_or_reuse_as: service_role required'; END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'pause_create_or_reuse_as: p_user_id required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse_as: unknown or inactive template slug %', p_template_slug; END IF;
  IF v_tpl.action_window_ms IS NULL THEN v_window_end := v_now + interval '100 years';
  ELSE v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0); END IF;
  SELECT * INTO v_open FROM public.pause_instances WHERE user_id = p_user_id AND state IN ('active', 'engaged') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match', 'pending_offer', false, 'prior_open_instance_id', null);
    END IF;
    UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
      metadata = metadata || jsonb_build_object('pending_offer_replaced', true) WHERE user_id = p_user_id AND state = 'pending';
    INSERT INTO public.pause_instances (user_id, template_id, state, source, context_snapshot, context_rule_result, context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata)
    VALUES (p_user_id, v_tpl.id, 'pending', p_source, COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb), p_context_fingerprint, v_now, v_window_end, NULL, jsonb_build_object('pending_replaces_open_id', v_open.id))
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', null, 'pending_offer', true, 'prior_open_instance_id', v_open.id);
  END IF;
  UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
    metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true) WHERE user_id = p_user_id AND state = 'pending';
  SELECT * INTO v_recent_dismiss FROM public.pause_instances WHERE user_id = p_user_id AND state IN ('dismissed', 'expired')
    AND context_fingerprint = p_context_fingerprint
    AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
    ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal', 'pending_offer', false, 'prior_open_instance_id', null); END IF;
  INSERT INTO public.pause_instances (user_id, template_id, state, source, context_snapshot, context_rule_result, context_fingerprint, window_starts_at, window_ends_at, superseded_by)
  VALUES (p_user_id, v_tpl.id, 'active', p_source, COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb), p_context_fingerprint, v_now, v_window_end, null)
  RETURNING id INTO v_new_id;
  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', null, 'pending_offer', false, 'prior_open_instance_id', null);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_create_or_reuse(
  p_template_slug text, p_source text, p_context_snapshot jsonb, p_context_rule_result jsonb, p_context_fingerprint text
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_tpl public.pause_templates%ROWTYPE; v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE; v_new_id uuid; v_now timestamptz := now(); v_window_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_create_or_reuse: authenticated user required (use pause_create_or_reuse_as for service_role)'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug; END IF;
  IF v_tpl.action_window_ms IS NULL THEN v_window_end := v_now + interval '100 years';
  ELSE v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0); END IF;
  SELECT * INTO v_open FROM public.pause_instances WHERE user_id = v_uid AND state IN ('active', 'engaged') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match', 'pending_offer', false, 'prior_open_instance_id', null);
    END IF;
    UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
      metadata = metadata || jsonb_build_object('pending_offer_replaced', true) WHERE user_id = v_uid AND state = 'pending';
    INSERT INTO public.pause_instances (user_id, template_id, state, source, context_snapshot, context_rule_result, context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata)
    VALUES (v_uid, v_tpl.id, 'pending', p_source, COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb), p_context_fingerprint, v_now, v_window_end, null, jsonb_build_object('pending_replaces_open_id', v_open.id))
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', null, 'pending_offer', true, 'prior_open_instance_id', v_open.id);
  END IF;
  UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
    metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true) WHERE user_id = v_uid AND state = 'pending';
  SELECT * INTO v_recent_dismiss FROM public.pause_instances WHERE user_id = v_uid AND state IN ('dismissed', 'expired')
    AND context_fingerprint = p_context_fingerprint
    AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
    ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal', 'pending_offer', false, 'prior_open_instance_id', null); END IF;
  INSERT INTO public.pause_instances (user_id, template_id, state, source, context_snapshot, context_rule_result, context_fingerprint, window_starts_at, window_ends_at, superseded_by)
  VALUES (v_uid, v_tpl.id, 'active', p_source, COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb), p_context_fingerprint, v_now, v_window_end, null)
  RETURNING id INTO v_new_id;
  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', null, 'pending_offer', false, 'prior_open_instance_id', null);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_dismiss_current()
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_open_id uuid; v_now timestamptz := now(); v_out public.pause_state;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_dismiss_current: not authenticated'; END IF;
  SELECT id INTO v_open_id FROM public.pause_instances WHERE user_id = v_uid AND state IN ('active', 'engaged') LIMIT 1;
  IF v_open_id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
    metadata = metadata || jsonb_build_object('cleared_with_dismiss_current', true) WHERE user_id = v_uid AND state = 'pending';
  v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');
  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_adopt_pending_offer()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_now timestamptz := now();
  v_pending public.pause_instances%ROWTYPE; v_open public.pause_instances%ROWTYPE; v_msg text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_adopt_pending_offer: not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  SELECT * INTO v_pending FROM public.pause_instances WHERE user_id = v_uid AND state = 'pending' ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_pending'); END IF;
  SELECT * INTO v_open FROM public.pause_instances WHERE user_id = v_uid AND state IN ('active', 'engaged') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    UPDATE public.pause_instances SET state = 'expired', expired_reason = 'superseded', terminal_at = v_now, superseded_by = v_pending.id WHERE id = v_open.id;
  END IF;
  UPDATE public.pause_instances SET state = 'active',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('pending_adopted_at', v_now) WHERE id = v_pending.id;
  SELECT content->>'message' INTO v_msg FROM public.pause_ai_artifacts WHERE pause_instance_id = v_pending.id AND kind = 'reflection_text' LIMIT 1;
  INSERT INTO public.library_items (user_id, type, title, body, source_type, pause_instance_id, tags, pinned, is_favorite)
  SELECT v_pending.user_id, 'bookmark', 'Pause', COALESCE(v_msg, ''), 'pause', v_pending.id, ARRAY[]::text[], false, false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.library_items li
    WHERE li.user_id = v_pending.user_id AND li.pause_instance_id = v_pending.id
      AND li.source_type = 'pause' AND li.status IS DISTINCT FROM 'deleted' AND li.status IS DISTINCT FROM 'archived'
  );
  RETURN jsonb_build_object('ok', true, 'instance_id', v_pending.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_decline_pending_offer()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_now timestamptz := now(); v_n int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_decline_pending_offer: not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  UPDATE public.pause_instances SET state = 'expired', expired_reason = 'system_cancelled', terminal_at = v_now,
    metadata = metadata || jsonb_build_object('pending_declined', true) WHERE user_id = v_uid AND state = 'pending';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_n > 0, 'cleared', v_n);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_adopt_pending_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_adopt_pending_offer() TO authenticated;
REVOKE ALL ON FUNCTION public.pause_decline_pending_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_decline_pending_offer() TO authenticated;

CREATE OR REPLACE FUNCTION public.notifications_from_pause_instances()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.state = 'active' THEN
    PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'pause_instances', NEW.id,
      jsonb_build_object('pause_instance_id', NEW.id, 'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source, 'severity', NEW.context_snapshot->>'severity', 'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at, 'pending_offer', false),
      '/pause', jsonb_build_object('pauseInstanceId', NEW.id::text), NEW.created_at);
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.state = 'pending' THEN
    PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'pause_instances', NEW.id,
      jsonb_build_object('pause_instance_id', NEW.id, 'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source, 'severity', NEW.context_snapshot->>'severity', 'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at, 'pending_offer', true),
      '/pause', jsonb_build_object('pauseInstanceId', NEW.id::text, 'pendingOffer', 'true'), NEW.created_at);
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.state = 'pending' AND NEW.state = 'active' THEN
    PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'pause_instances', NEW.id,
      jsonb_build_object('pause_instance_id', NEW.id, 'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source, 'severity', NEW.context_snapshot->>'severity', 'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at, 'pending_offer', false),
      '/pause', jsonb_build_object('pauseInstanceId', NEW.id::text), NEW.created_at);
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.state IN ('active', 'engaged') AND NEW.state IN ('completed', 'dismissed', 'expired') THEN
    UPDATE public.notifications SET dismissed_at = now() WHERE source_table = 'pause_instances' AND source_id = NEW.id AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.state = 'pending' AND NEW.state = 'expired' THEN
    UPDATE public.notifications SET dismissed_at = now() WHERE source_table = 'pause_instances' AND source_id = NEW.id AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;