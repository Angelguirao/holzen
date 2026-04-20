
CREATE OR REPLACE FUNCTION public.emit_heartbeat(hb_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  base_url text;
  hb_uuid text;
  url text;
BEGIN
  IF hb_id IS NULL OR length(hb_id) = 0 THEN
    RETURN;
  END IF;

  -- Read heartbeat UUID from app_config (key = 'heartbeat_<job_name>')
  SELECT (value #>> '{}') INTO hb_uuid
  FROM public.app_config
  WHERE key = 'heartbeat_' || hb_id;

  IF hb_uuid IS NULL OR length(hb_uuid) = 0 THEN
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

  url := base_url || hb_uuid;

  BEGIN
    PERFORM net.http_get(url);
  EXCEPTION WHEN others THEN
    PERFORM NULL;
  END;
END;
$function$;
