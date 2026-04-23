-- ============================================================================
-- Pause V2 — Phase J: cutover helpers (NOT the flip itself)
--
-- This migration is SAFE to sync whenever. It:
--   1. Revokes client INSERT on public.reflections so only service_role
--      (edge functions) can write rows. The manual-pause hook and the
--      check-volatility cron still work because they use the service
--      role / SECURITY DEFINER paths; user-triggered direct inserts are
--      not part of our API surface anyway.
--   2. Installs two operator RPCs that the cutover runbook invokes
--      *manually* from the SQL editor:
--        * public.cutover_flip_pause_v2(_on boolean)
--        * public.cutover_reset_user_badges_baseline()
--      Neither fires automatically from this migration. Shipping them as
--      functions keeps the cutover reproducible and auditable in case
--      we rollback/redo.
--
-- Non-destructive by itself. See docs/ops/pause-v2-cutover-runbook.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Revoke direct client INSERT on reflections.
-- ---------------------------------------------------------------------------
-- The legacy INSERT policy allowed authenticated users to insert rows
-- they own. During Pause V2 cutover, user-triggered inserts flow through
-- the pause_create_or_reuse RPC and the service-role edge path; there's
-- no longer a reason for direct client INSERTs. Drop the policy so we
-- pin down the surface area.

DROP POLICY IF EXISTS "Users can insert their own reflections" ON public.reflections;

-- service_role's existing ALL policy remains, so cron + edge functions
-- keep writing without change. SELECT / UPDATE (favorites) policies
-- also remain — reads + user metadata edits still work.

-- ---------------------------------------------------------------------------
-- 2. cutover_flip_pause_v2(_on boolean)
-- ---------------------------------------------------------------------------
-- Flips the app_config.feature_flags.pause_v2_enabled boolean and
-- stamps updated_at. Returns the resulting flag value.
--
-- Admin-only; caller must be authenticated AND pass is_admin().

CREATE OR REPLACE FUNCTION public.cutover_flip_pause_v2(_on boolean)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'cutover_flip_pause_v2: admin required';
  END IF;

  UPDATE public.app_config
     SET value = jsonb_set(COALESCE(value, '{}'::jsonb), '{pause_v2_enabled}', to_jsonb(_on)),
         updated_at = now()
   WHERE key = 'feature_flags';

  RETURN _on;
END;
$$;

REVOKE ALL ON FUNCTION public.cutover_flip_pause_v2(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cutover_flip_pause_v2(boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. cutover_reset_user_badges_baseline()
-- ---------------------------------------------------------------------------
-- Truncates public.user_badges so Phase H's BadgesPanelV2 recomputes
-- earned_at from the new model on next render.
--
-- Admin-only. Deliberately a no-op if called when the flag is still
-- false (prevents accidental pre-cutover wipes). If you want a forced
-- reset, pass _force => true.

CREATE OR REPLACE FUNCTION public.cutover_reset_user_badges_baseline(_force boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_on boolean;
  v_deleted integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'cutover_reset_user_badges_baseline: admin required';
  END IF;

  IF NOT _force THEN
    SELECT COALESCE((value->>'pause_v2_enabled')::boolean, false)
      INTO v_on
      FROM public.app_config
     WHERE key = 'feature_flags'
     LIMIT 1;

    IF NOT v_on THEN
      RAISE EXCEPTION 'cutover_reset_user_badges_baseline: pause_v2_enabled must be true (pass _force=true to override)';
    END IF;
  END IF;

  WITH victims AS (
    DELETE FROM public.user_badges RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM victims;

  RETURN COALESCE(v_deleted, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.cutover_reset_user_badges_baseline(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cutover_reset_user_badges_baseline(boolean) TO authenticated;
