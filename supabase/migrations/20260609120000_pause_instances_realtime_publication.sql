-- Home / Library resync when cron or manual pause lifecycle changes `pause_instances`.
-- Client: `usePauseInstancesRealtime` → `syncOpenPauseFromDb` (filtered by user_id).

ALTER TABLE public.pause_instances REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pause_instances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pause_instances;
  END IF;
END;
$$;
