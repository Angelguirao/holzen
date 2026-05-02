DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'pause_state' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.pause_state ADD VALUE 'pending';
  END IF;
END$$;