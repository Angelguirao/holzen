-- Community “paused today” cache + Realtime: one public row, refreshed when pause_instances change.
-- Clients invalidate TanStack Query on UPDATE — no polling.

CREATE TABLE IF NOT EXISTS public.holzen_community_stats (
  id text PRIMARY KEY,
  users_paused_today integer NOT NULL DEFAULT 0,
  percent integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.holzen_community_stats IS
  'Public aggregate cache for Home Market footer; id = ''today'' (UTC day). No PII.';

ALTER TABLE public.holzen_community_stats REPLICA IDENTITY FULL;

ALTER TABLE public.holzen_community_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY holzen_community_stats_select
  ON public.holzen_community_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.holzen_community_stats FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.compute_holzen_number_stats()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  WITH day_start AS (
    SELECT date_trunc('day', (now() AT TIME ZONE 'utc')) AS ts
  ),
  paused_today AS (
    SELECT COUNT(DISTINCT pi.user_id)::bigint AS n
      FROM public.pause_instances pi
      CROSS JOIN day_start d
     WHERE pi.created_at >= d.ts
       AND pi.state <> 'pending'
  ),
  onboarded AS (
    SELECT COUNT(*)::bigint AS n
      FROM public.profiles p
     WHERE p.has_onboarded = true
  )
  SELECT jsonb_build_object(
    'users_paused_today', (SELECT n FROM paused_today),
    'percent', CASE
      WHEN (SELECT n FROM onboarded) = 0 THEN 0
      ELSE ROUND(
        (SELECT n FROM paused_today)::numeric /
        (SELECT n FROM onboarded)::numeric * 100
      )
    END,
    'calculated_at', now()
  );
$$;

CREATE OR REPLACE FUNCTION public.refresh_holzen_community_stats()
  RETURNS void
  LANGUAGE plpgsql
  VOLATILE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  v_stats := public.compute_holzen_number_stats();
  INSERT INTO public.holzen_community_stats (id, users_paused_today, percent, calculated_at)
  VALUES (
    'today',
    (v_stats->>'users_paused_today')::integer,
    (v_stats->>'percent')::integer,
    (v_stats->>'calculated_at')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    users_paused_today = EXCLUDED.users_paused_today,
    percent = EXCLUDED.percent,
    calculated_at = EXCLUDED.calculated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_holzen_number()
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_row public.holzen_community_stats%ROWTYPE;
  v_day_start timestamptz := date_trunc('day', (now() AT TIME ZONE 'utc'));
BEGIN
  SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'today';

  IF NOT FOUND OR v_row.calculated_at < v_day_start THEN
    PERFORM public.refresh_holzen_community_stats();
    SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'today';
  END IF;

  RETURN jsonb_build_object(
    'users_paused_today', v_row.users_paused_today,
    'percent', v_row.percent,
    'calculated_at', v_row.calculated_at
  );
END;
$$;

COMMENT ON FUNCTION public.get_holzen_number() IS
  'Public aggregate: reads holzen_community_stats (today); refreshes if missing or stale UTC day.';

CREATE OR REPLACE FUNCTION public.trg_pause_instances_refresh_community_stats()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_holzen_community_stats();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pause_instances_refresh_holzen_community_stats ON public.pause_instances;

CREATE TRIGGER trg_pause_instances_refresh_holzen_community_stats
  AFTER INSERT OR UPDATE OF state ON public.pause_instances
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trg_pause_instances_refresh_community_stats();

SELECT public.refresh_holzen_community_stats();

DO $pub$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'holzen_community_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.holzen_community_stats;
  END IF;
END;
$pub$;
