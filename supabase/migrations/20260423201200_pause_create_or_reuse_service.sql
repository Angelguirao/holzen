-- ============================================================================
-- Service-role variant of pause_create_or_reuse.
--
-- The canonical pause_create_or_reuse RPC resolves the owner via
-- auth.uid(). That works for authenticated clients (manual pause hook)
-- but edge crons run as service_role with no user context, and need to
-- create pauses on behalf of specific users.
--
-- This adds a wrapper that takes an explicit p_user_id and is callable
-- only by service_role. Semantics are otherwise identical to the base
-- function.
--
-- Additionally acquires a transactional advisory lock keyed on the
-- target user_id so two concurrent cron ticks for the same user
-- serialize here rather than racing into a unique-violation on the
-- partial index uniq_active_pause_per_user. Fixes the A-issue #1
-- read-then-insert race.
-- ============================================================================

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
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_create_or_reuse_as: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'pause_create_or_reuse_as: p_user_id required';
  END IF;

  -- Serialize concurrent ticks for this user. The lock is held for the
  -- rest of the transaction and released automatically on COMMIT.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates
    WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_create_or_reuse_as: unknown or inactive template slug %', p_template_slug;
  END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  -- Open pause?
  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = p_user_id
     AND state IN ('active','engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id,
        'created', false,
        'reused_reason', 'fingerprint_match'
      );
    ELSE
      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'context_lost',
             terminal_at = v_now
       WHERE id = v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss
      FROM public.pause_instances
     WHERE user_id = p_user_id
       AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => v_tpl.window_ms / 1000.0))
     ORDER BY terminal_at DESC
     LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'instance_id', NULL,
        'created', false,
        'reused_reason', 'recent_dismissal'
      );
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source,
    context_snapshot, context_rule_result, context_fingerprint,
    window_starts_at, window_ends_at,
    superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb),
    COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint,
    v_now, v_window_end,
    NULL
  )
  RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pause_create_or_reuse_as(uuid, text, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_create_or_reuse_as(uuid, text, text, jsonb, jsonb, text) TO service_role;

-- Also harden the base pause_create_or_reuse RPC with the same advisory
-- lock, so the client manual path doesn't race with a concurrent cron tick
-- (they lock on the same user key).
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
  v_role text := auth.role();
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN
    RAISE EXCEPTION 'pause_create_or_reuse: not authorized';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug;
  END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active','engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id,
        'created', false,
        'reused_reason', 'fingerprint_match'
      );
    ELSE
      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'context_lost',
             terminal_at = v_now
       WHERE id = v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss
      FROM public.pause_instances
     WHERE user_id = v_uid
       AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => v_tpl.window_ms / 1000.0))
     ORDER BY terminal_at DESC
     LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'instance_id', NULL,
        'created', false,
        'reused_reason', 'recent_dismissal'
      );
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source,
    context_snapshot, context_rule_result, context_fingerprint,
    window_starts_at, window_ends_at,
    superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb),
    COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint,
    v_now, v_window_end,
    NULL
  )
  RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', NULL
  );
END;
$$;
