-- ============================================================================
-- Pause V2 — Phase A, part 4: state-machine transition engine
--
-- Four helpers:
--   public.pause_evaluate_transitions(p_instance_id uuid) -> pause_state
--   public.pause_dismiss(p_instance_id uuid, p_reason text default null)
--   public.pause_expire(p_instance_id uuid, p_reason pause_expired_reason)
--   public.pause_sweep_window_elapsed() -> integer
--
-- Plus AFTER-INSERT triggers on pause_step_events and pause_companion_events
-- that call evaluate_transitions so state always stays derivable from events.
--
-- All functions follow docs/ops/migration-security-conventions.md:
-- SECURITY DEFINER is used only where we must write across RLS boundaries
-- (here: definer, because evaluate must read/update instance rows; callers
-- are authenticated users logging their own events). Callers are validated
-- via user_id match on the paired event row.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. pause_evaluate_transitions(p_instance_id uuid) -> pause_state
-- ---------------------------------------------------------------------------
-- Re-reads the instance, its template, and its event logs. Flips state
-- (and stamps engaged_at / completed_at / terminal_at) according to the
-- template's gates. Idempotent: safe to call repeatedly.
--
-- Returns the state AFTER evaluation.
--
-- Skip rules:
--   - If state is already terminal (completed/dismissed/expired), no-op.
--   - If window_ends_at < now(), expire with window_elapsed (callers can also
--     invoke pause_sweep_window_elapsed instead).
--
-- Contract:
--   - A step_type counts iff its enum text value appears in
--     template.required_for_{engaged,completed}.
--   - A counted companion is a pause_companion_events row with
--     action='complete' AND counts_for_pause=true for this instance.

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
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Terminal states are final.
  IF v_inst.state IN ('completed','dismissed','expired') THEN
    RETURN v_inst.state;
  END IF;

  -- Window elapsed -> expire.
  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'window_elapsed',
           terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'expired';
  END IF;

  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN
    -- Template gone (shouldn't happen under ON DELETE RESTRICT, but defend).
    RETURN v_inst.state;
  END IF;

  -- Collect distinct step_type text values observed for this instance.
  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[])
    INTO v_step_types
    FROM public.pause_step_events
   WHERE pause_instance_id = p_instance_id;

  -- Counted companion completions (uniqueness enforced by partial index).
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
           engaged_at   = COALESCE(engaged_at,   v_now),
           terminal_at  = v_now
     WHERE id = p_instance_id;
    RETURN 'completed';
  END IF;

  IF v_engaged_ok AND v_inst.state = 'active' THEN
    UPDATE public.pause_instances
       SET state = 'engaged',
           engaged_at = COALESCE(engaged_at, v_now)
     WHERE id = p_instance_id;
    RETURN 'engaged';
  END IF;

  RETURN v_inst.state;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_evaluate_transitions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_evaluate_transitions(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. pause_dismiss(p_instance_id uuid, p_reason text default null) -> pause_state
-- ---------------------------------------------------------------------------
-- User-initiated end. No-op if already terminal. Caller must own the row
-- (validated: auth.uid() = instance.user_id) or be service_role.

CREATE OR REPLACE FUNCTION public.pause_dismiss(
  p_instance_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
  v_caller_role text := auth.role();
  v_caller_uid  uuid := auth.uid();
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_dismiss: instance not found';
  END IF;

  IF v_caller_role <> 'service_role' AND v_inst.user_id <> v_caller_uid THEN
    RAISE EXCEPTION 'pause_dismiss: not authorized';
  END IF;

  IF v_inst.state IN ('completed','dismissed','expired') THEN
    RETURN v_inst.state;
  END IF;

  UPDATE public.pause_instances
     SET state = 'dismissed',
         dismissed_by_user = true,
         terminal_at = v_now,
         metadata = metadata || COALESCE(jsonb_build_object('dismiss_reason', p_reason), '{}'::jsonb)
   WHERE id = p_instance_id;

  RETURN 'dismissed';
END;
$$;

REVOKE ALL ON FUNCTION public.pause_dismiss(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_dismiss(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. pause_expire(p_instance_id uuid, p_reason pause_expired_reason) -> pause_state
-- ---------------------------------------------------------------------------
-- System-initiated end. Only service_role (transactions/sweepers/edges) may
-- call this; authenticated users cannot silently kill their own pause.

CREATE OR REPLACE FUNCTION public.pause_expire(
  p_instance_id uuid,
  p_reason public.pause_expired_reason
)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_expire: service_role required';
  END IF;

  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_expire: instance not found';
  END IF;

  IF v_inst.state IN ('completed','dismissed','expired') THEN
    RETURN v_inst.state;
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = p_reason,
         terminal_at = v_now
   WHERE id = p_instance_id;

  RETURN 'expired';
END;
$$;

REVOKE ALL ON FUNCTION public.pause_expire(uuid, public.pause_expired_reason) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_expire(uuid, public.pause_expired_reason) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. pause_sweep_window_elapsed() -> integer
-- ---------------------------------------------------------------------------
-- Batch expire open pauses whose window has elapsed. Intended to be called
-- by pg_cron every minute (see Phase L docs/ops/cron-setup.md update).
-- Returns the number of rows expired.

CREATE OR REPLACE FUNCTION public.pause_sweep_window_elapsed()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count integer;
BEGIN
  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active','engaged')
       AND window_ends_at <= v_now
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'window_elapsed',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_sweep_window_elapsed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_sweep_window_elapsed() TO service_role;

-- ---------------------------------------------------------------------------
-- 5. AFTER-INSERT triggers: keep state derivable from events
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_pause_step_events_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pause_step_events_ai ON public.pause_step_events;
CREATE TRIGGER trg_pause_step_events_ai
AFTER INSERT ON public.pause_step_events
FOR EACH ROW
EXECUTE FUNCTION public.trg_pause_step_events_after_insert();

CREATE OR REPLACE FUNCTION public.trg_pause_companion_events_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only counted completions can advance state; skip evaluation for opens or
  -- non-counting completes so we don't hammer the evaluator unnecessarily.
  IF NEW.action = 'complete'
     AND NEW.counts_for_pause = true
     AND NEW.pause_instance_id IS NOT NULL THEN
    PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pause_companion_events_ai ON public.pause_companion_events;
CREATE TRIGGER trg_pause_companion_events_ai
AFTER INSERT ON public.pause_companion_events
FOR EACH ROW
EXECUTE FUNCTION public.trg_pause_companion_events_after_insert();
