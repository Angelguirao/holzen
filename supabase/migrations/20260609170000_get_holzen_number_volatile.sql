-- get_holzen_number() may call refresh_holzen_community_stats() (INSERT/UPSERT).
-- PostgREST runs STABLE RPCs in a read-only transaction → "cannot execute INSERT
-- in a read-only transaction" when cache is missing or stale (UTC day rollover).

BEGIN;

ALTER FUNCTION public.get_holzen_number() VOLATILE;

COMMENT ON FUNCTION public.get_holzen_number() IS
  'Public aggregate: pausing now (active|engaged) + paused today (UTC); % of onboarded profiles. VOLATILE — may refresh holzen_community_stats via PostgREST/edge RPC.';

COMMIT;
