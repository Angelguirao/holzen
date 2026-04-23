-- ============================================================================
-- Pause V2 — Phase B: client/edge RPC surface
--
-- Four SECURITY DEFINER RPCs that encapsulate every permissible pause
-- mutation. Clients and edge functions go through these instead of writing
-- pause_* tables directly.
--
-- Why DEFINER:
--   pause_instances and the event tables have *no* authenticated INSERT
--   policy. Writes must be gated here so we can (a) enforce the
--   one-open-pause invariant on create, (b) compute counts_for_pause
--   server-side, (c) validate the caller owns the instance.
--
-- Caller contract:
--   - auth.uid() must match the row's user_id for user-callable RPCs.
--   - service_role bypasses owner check (cron + edges).
--   - All functions SET search_path = public (or public, extensions when
--     relevant) per docs/ops/migration-security-conventions.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. pause_create_or_reuse(
--      p_template_slug text,
--      p_source text,
--      p_context_snapshot jsonb,
--      p_context_rule_result jsonb,
--      p_context_fingerprint text
--    ) RETURNS jsonb { instance_id uuid, created boolean, reused_reason text? }
-- ---------------------------------------------------------------------------
-- The canonical "create a pause" RPC. Implements the idempotency rule from
-- PLAN.md §2.9:
--   1. If there's an open pause for this user with matching fingerprint ->
--      return it with created=false, reused_reason='fingerprint_match'.
--   2. If there's an open pause with a different fingerprint -> expire the
--      old (context_lost, superseded_by=new) and create the new.
--   3. If there's a dismissed/expired pause within the last window_ms for
--      this template with matching fingerprint -> return nothing new,
--      reused_reason='recent_dismissal'. Caller decides whether to open the
--      stale row or ignore.
--   4. Otherwise -> create a fresh active instance.
--
-- Returns the resulting (or reused) instance id. Callers (edge + hook) use
-- the created/reused_reason to decide whether to dispatch a push / show
-- a new reflection / etc.

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

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug;
  END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  -- Fast path: open pause for this user?
  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active','engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      -- Matching fingerprint -> idempotent reuse.
      RETURN jsonb_build_object(
        'instance_id', v_open.id,
        'created', false,
        'reused_reason', 'fingerprint_match'
      );
    ELSE
      -- Regime changed -> expire the old, then create the new.
      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'context_lost',
             terminal_at = v_now
       WHERE id = v_open.id;
    END IF;
  ELSE
    -- No open pause: check for a *recent* dismissal/expiry with matching
    -- fingerprint within this template's window. Prevents cron from
    -- pestering the user with the same context they just walked away from.
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

  -- If we expired a prior open pause, point its superseded_by at the new one.
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

REVOKE ALL ON FUNCTION public.pause_create_or_reuse(text, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_create_or_reuse(text, text, jsonb, jsonb, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. pause_log_step(
--      p_instance_id uuid,
--      p_step_type public.pause_step_type,
--      p_payload jsonb
--    ) RETURNS public.pause_state
-- ---------------------------------------------------------------------------
-- Append a step event. Triggers the transition engine via AFTER-INSERT.
-- Returns the (possibly changed) state after evaluation. Caller must own
-- the instance or be service_role. Silently no-ops if instance is terminal.

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
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id;
  END IF;

  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
  END IF;

  IF v_inst.state IN ('completed','dismissed','expired') THEN
    -- Don't accept late events into terminal instances. State unchanged.
    RETURN v_inst.state;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  -- Trigger already evaluated; re-read the row.
  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. pause_log_companion(
--      p_instance_id uuid | null,
--      p_companion_type text,
--      p_action public.pause_companion_action,
--      p_entry_point text
--    ) RETURNS jsonb { counts_for_pause boolean, non_counting_reason text?,
--                     resulting_state public.pause_state? }
-- ---------------------------------------------------------------------------
-- Records a companion open/complete. Server-side computes counts_for_pause
-- per PLAN.md §5 so clients can't lie. Returns the outcome so UIs can
-- visually reflect "this counted" / "this was a global save only".
--
-- If p_instance_id is null, the event is recorded as a global (library/bell)
-- completion with counts_for_pause=false, reason='no_active_pause'.

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
  v_already boolean;
  v_state public.pause_state;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN
    RAISE EXCEPTION 'pause_log_companion: not authorized';
  END IF;

  -- Resolve the effective user. For authenticated callers this is auth.uid();
  -- service_role may act on behalf of a user whose pause it's processing.
  IF p_instance_id IS NOT NULL THEN
    SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'pause_log_companion: instance % not found', p_instance_id;
    END IF;
    IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
      RAISE EXCEPTION 'pause_log_companion: not authorized';
    END IF;
    v_effective_user_id := v_inst.user_id;
  ELSE
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'pause_log_companion: need instance id when invoked as service_role';
    END IF;
    v_effective_user_id := v_uid;
  END IF;

  -- Only completes can count; opens always counts_for_pause=false.
  IF p_action = 'complete' AND p_instance_id IS NOT NULL THEN
    IF v_inst.state NOT IN ('active','engaged') THEN
      v_reason := CASE v_inst.state
                    WHEN 'completed' THEN 'no_active_pause'
                    WHEN 'dismissed' THEN 'no_active_pause'
                    WHEN 'expired' THEN
                      CASE v_inst.expired_reason::text
                        WHEN 'context_lost' THEN 'context_lost'
                        WHEN 'window_elapsed' THEN 'outside_window'
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
        SELECT EXISTS (
          SELECT 1 FROM public.pause_companion_events
           WHERE pause_instance_id = p_instance_id
             AND companion_type = p_companion_type
             AND action = 'complete'
             AND counts_for_pause = true
        ) INTO v_already;
        IF v_already THEN
          v_reason := 'already_counted';
        ELSE
          v_counts := true;
        END IF;
      END IF;
    END IF;
  ELSIF p_action = 'complete' AND p_instance_id IS NULL THEN
    v_reason := 'no_active_pause';
  END IF;

  INSERT INTO public.pause_companion_events (
    pause_instance_id, user_id, companion_type, action, entry_point,
    counts_for_pause, non_counting_reason
  ) VALUES (
    p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
    v_counts, v_reason
  );

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

REVOKE ALL ON FUNCTION public.pause_log_companion(uuid, text, public.pause_companion_action, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_log_companion(uuid, text, public.pause_companion_action, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. pause_dismiss_current() -> pause_state
-- ---------------------------------------------------------------------------
-- Convenience for clients: dismiss whichever open pause I have. No-op if I
-- have none. Uses pause_dismiss internally.

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
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_dismiss_current: not authenticated';
  END IF;

  SELECT id INTO v_open_id
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active','engaged')
   LIMIT 1;

  IF v_open_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN public.pause_dismiss(v_open_id, 'user_dismissed_current');
END;
$$;

REVOKE ALL ON FUNCTION public.pause_dismiss_current() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_dismiss_current() TO authenticated;
