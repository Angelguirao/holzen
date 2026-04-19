CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.emit_heartbeat(hb_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url text;
  url text;
BEGIN
  IF hb_id IS NULL OR length(hb_id) = 0 THEN
    RETURN;
  END IF;

  BEGIN
    base_url := current_setting('app.heartbeat_base_url', true);
  EXCEPTION WHEN others THEN
    base_url := NULL;
  END;
  IF base_url IS NULL OR length(base_url) = 0 THEN
    base_url := 'https://uptime.betterstack.com/api/v1/heartbeat/';
  END IF;

  url := base_url || hb_id;

  BEGIN
    PERFORM net.http_get(url);
  EXCEPTION WHEN others THEN
    PERFORM NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.emit_heartbeat(text) IS
  'Fires a non-blocking HTTP GET to the heartbeat endpoint (BetterStack Heartbeats by default). Wire into each cron job AFTER its real work.';