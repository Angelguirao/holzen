
CREATE OR REPLACE FUNCTION public.claim_trigger_slot(_user_id uuid, _cooldown_hours integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Atomically try to claim the trigger slot.
  -- Only succeeds if cooldown has elapsed (or last_trigger_at is null).
  UPDATE public.profiles
  SET last_trigger_at = now()
  WHERE user_id = _user_id
    AND (
      last_trigger_at IS NULL
      OR last_trigger_at < now() - make_interval(hours => _cooldown_hours)
    );
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
