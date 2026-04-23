-- Harden claim_trigger_slot:
-- 1) restrict invocation to service_role only
-- 2) validate inputs and clamp cooldown to a safe range
CREATE OR REPLACE FUNCTION public.claim_trigger_slot(_user_id uuid, _cooldown_hours integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
  effective_cooldown_hours integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'claim_trigger_slot is restricted to service_role'
      USING ERRCODE = '42501';
  END IF;

  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Keep cooldown within the product-supported range to prevent negative
  -- values from bypassing the lock and to avoid unbounded intervals.
  effective_cooldown_hours := LEAST(GREATEST(COALESCE(_cooldown_hours, 6), 1), 24);

  UPDATE public.profiles
  SET last_trigger_at = now()
  WHERE user_id = _user_id
    AND (
      last_trigger_at IS NULL
      OR last_trigger_at < now() - make_interval(hours => effective_cooldown_hours)
    );

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trigger_slot(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trigger_slot(uuid, integer) TO service_role;
