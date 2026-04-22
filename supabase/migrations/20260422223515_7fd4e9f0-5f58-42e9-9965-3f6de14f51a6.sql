-- Harden notifications_upsert: fix search_path, owner, and execution privileges
ALTER FUNCTION public.notifications_upsert(uuid, text, text, uuid, jsonb, text, jsonb, timestamptz)
  SET search_path = public, auth, pg_temp;

ALTER FUNCTION public.notifications_upsert(uuid, text, text, uuid, jsonb, text, jsonb, timestamptz)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.notifications_upsert(uuid, text, text, uuid, jsonb, text, jsonb, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notifications_upsert(uuid, text, text, uuid, jsonb, text, jsonb, timestamptz) TO service_role, authenticated;