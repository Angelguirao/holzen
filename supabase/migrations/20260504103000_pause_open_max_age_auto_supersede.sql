-- ============================================================================
-- Pause: open max age (12h), stale pending (12h), auto-supersede untouched open
--
-- Policy (see docs/systems/pause-system.md):
-- * At most ONE pending context offer per user; newer fingerprint replaces
--   older pending (expired system_cancelled) — never accumulate pendings.
-- * If regime changes while user has active|engaged pause but they never
--   touched it (no step events, no companion events, not engaged), expire the
--   open pause and create the new row as active immediately (no modal).
-- * active|engaged rows older than 12h wall-clock from created_at expire with
--   open_max_age (sweep + transition engine).
-- * pending rows older than 12h from created_at expire (system_cancelled).
-- ============================================================================

-- 1) New terminal reason for max open age
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'pause_expired_reason' AND e.enumlabel = 'open_max_age'
  ) THEN
    ALTER TYPE public.pause_expired_reason ADD VALUE 'open_max_age';
  END IF;
END$$;

-- 2) Transition engine: cap open lifetime + pending short-circuit unchanged tail
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
  v_now timestamptz := now();
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

  IF v_inst.state IN ('active', 'engaged') AND v_inst.created_at <= v_now - interval '12 hours' THEN
    UPDATE public.pause_instances
       SET state = 'expired', expired_reason = 'open_max_age', terminal_at = v_now
     WHERE id = p_instance_id;
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

  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  v_completed_ok :=
    (v_tpl.required_for_completed <@ v_step_types)
    AND (v_counted_count >= v_tpl.required_companion_count);

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

-- 3) pause_log_companion — treat open_max_age like clock expiry for companion UX
CREATE OR REPLACE FUNCTION public.pause_log_companion(
  p_instance_id uuid,
  p_companion_type text,
  p_action public.pause_companion_action,
  p_entry_point text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_effective_user_id uuid;
  v_inst public.pause_instances%ROWTYPE;
  v_tpl public.pause_templates%ROWTYPE;
  v_counts boolean := false;
  v_reason text := NULL;
  v_now timestamptz := now();
  v_state public.pause_state;
  v_inserted_id uuid;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN
    RAISE EXCEPTION 'pause_log_companion: not authorized';
  END IF;

  IF p_instance_id IS NOT NULL THEN
    SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_companion: instance % not found', p_instance_id; END IF;
    IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
      RAISE EXCEPTION 'pause_log_companion: not authorized';
    END IF;
    v_effective_user_id := v_inst.user_id;
  ELSE
    IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_log_companion: need instance id when invoked as service_role'; END IF;
    v_effective_user_id := v_uid;
  END IF;

  IF p_action = 'complete' AND p_instance_id IS NOT NULL THEN
    IF v_inst.state NOT IN ('active', 'engaged') THEN
      v_reason := CASE v_inst.state
                    WHEN 'pending' THEN 'no_active_pause'
                    WHEN 'completed' THEN 'no_active_pause'
                    WHEN 'dismissed' THEN 'no_active_pause'
                    WHEN 'expired' THEN
                      CASE v_inst.expired_reason::text
                        WHEN 'context_lost' THEN 'context_lost'
                        WHEN 'window_elapsed' THEN 'outside_window'
                        WHEN 'open_max_age' THEN 'outside_window'
                        ELSE 'no_active_pause'
                      END
                    ELSE 'no_active_pause'
                  END;
    ELSIF v_inst.window_ends_at <= v_now THEN
      v_reason := 'outside_window';
    ELSE
      SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
      IF p_companion_type <> ALL (v_tpl.allowed_companion_types) THEN
        v_reason := 'not_allowed_for_template';
      ELSE
        v_counts := true;
      END IF;
    END IF;
  ELSIF p_action = 'complete' AND p_instance_id IS NULL THEN
    v_reason := 'no_active_pause';
  END IF;

  IF v_counts THEN
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      true, NULL
    )
    ON CONFLICT (pause_instance_id, companion_type)
      WHERE action = 'complete' AND counts_for_pause = true
      DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
      v_counts := false;
      v_reason := 'already_counted';
      INSERT INTO public.pause_companion_events (
        pause_instance_id, user_id, companion_type, action, entry_point,
        counts_for_pause, non_counting_reason
      ) VALUES (
        p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
        false, v_reason
      );
    END IF;
  ELSE
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      false, v_reason
    );
  END IF;

  IF p_instance_id IS NOT NULL THEN
    SELECT state INTO v_state FROM public.pause_instances WHERE id = p_instance_id;
  END IF;

  RETURN jsonb_build_object(
    'counts_for_pause', v_counts,
    'non_counting_reason', v_reason,
    'resulting_state', v_state
  );
END;
$$;

-- 4) Batch sweeps: template window, then 12h open cap, then stale pending
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

  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active', 'engaged')
       AND created_at <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'open_max_age',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

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

-- 5) pause_create_or_reuse_as — auto active when open pause untouched
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

-- 6) pause_create_or_reuse (authenticated) — same branching
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

-- 7) Metrics view — count open_max_age expiries
DROP VIEW IF EXISTS public.v_pause_metrics_daily;
CREATE VIEW public.v_pause_metrics_daily
WITH (security_invoker = true)
AS
SELECT
  user_id,
  date_trunc('day', created_at)::date AS day,
  count(*) AS created,
  count(*) FILTER (WHERE engaged_at   IS NOT NULL) AS engaged,
  count(*) FILTER (WHERE state = 'completed')      AS completed,
  count(*) FILTER (WHERE state = 'dismissed')      AS dismissed,
  count(*) FILTER (WHERE state = 'expired')        AS expired,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'context_lost')    AS expired_context_lost,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'window_elapsed')  AS expired_window_elapsed,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'open_max_age')    AS expired_open_max_age,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'superseded')      AS expired_superseded,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'ineligible_user_state') AS expired_ineligible,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'system_cancelled') AS expired_system_cancelled
FROM public.pause_instances
GROUP BY 1, 2;

COMMENT ON VIEW public.v_pause_metrics_daily IS
  'Per-user, per-day pause lifecycle counters. Feeds admin dashboards.';
