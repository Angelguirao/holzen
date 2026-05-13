-- Tighten outcome validation on the main pause_log_step path (active / engaged).
--
-- Until now only the retrospective rescue branches (state = expired / dismissed)
-- enforced an `outcome` enum; the live ritual path silently accepted any string
-- in payload.outcome. The Decide UI in src/components/pause/PauseDecide.tsx only
-- emits `held | bought | sold`, but the legacy `nothing` value (and any typo)
-- could still land in pause_step_events.payload via direct RPC calls.
--
-- This migration mirrors the retrospective rule (held / bought / sold) on the
-- main insert too, so v_pause_full.outcome is always one of those three values
-- for newly-created rows. Historical `nothing` rows remain in place and are
-- treated as a neutral outcome by stats/badges (see src/lib/stats/pause-score.ts
-- and src/lib/badges/compute.ts after this PR).

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
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
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
    RETURN v_inst.state;
  END IF;

  -- Main (active / engaged) path: validate outcome_logged payload before insert.
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

COMMENT ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) IS
  'Logs pause_step_events; outcome_logged payloads (main and retrospective) must use outcome in (held, bought, sold).';
