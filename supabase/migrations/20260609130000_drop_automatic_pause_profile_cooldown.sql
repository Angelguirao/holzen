-- Automatic pauses no longer use profiles.cooldown_hours as a claim gate.
-- Thresholds, quiet hours, snooze, open-pause reuse, and fingerprint idempotency
-- remain. claim_trigger_slot still stamps last_trigger_at for audit only.

CREATE OR REPLACE FUNCTION public.claim_trigger_slot(_user_id uuid, _cooldown_hours integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'claim_trigger_slot is restricted to service_role'
      USING ERRCODE = '42501';
  END IF;

  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET last_trigger_at = now()
  WHERE user_id = _user_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trigger_slot(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trigger_slot(uuid, integer) TO service_role;
