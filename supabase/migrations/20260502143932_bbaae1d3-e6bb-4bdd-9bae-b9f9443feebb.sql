DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'pause_expired_reason' AND e.enumlabel = 'open_max_age'
  ) THEN
    ALTER TYPE public.pause_expired_reason ADD VALUE 'open_max_age';
  END IF;
END$$;