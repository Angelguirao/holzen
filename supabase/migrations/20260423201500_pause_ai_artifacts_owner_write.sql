-- ============================================================================
-- Pause V2 — owner-write RLS policy for pause_ai_artifacts.
--
-- The manual-trigger client path (`use-holzen.ts` / `generateMessage`) upserts
-- pause_ai_artifacts rows directly after creating the paired pause instance
-- via the pause_create_or_reuse RPC. Phase A shipped only SELECT + service_role
-- write policies, so those client upserts would be silently denied by RLS.
--
-- This migration adds owner-scoped INSERT + UPDATE policies.
--
-- Contract:
--   - The inserted / updated row MUST reference a pause_instance_id the caller
--     owns; we enforce that with a sub-select against pause_instances so the
--     policy itself denies cross-user writes even if the client lies.
--   - user_id on the row must equal auth.uid() (the client is expected to
--     pass its own uid when building the upsert).
--   - DELETE stays service_role-only (Phase A hasn't specified any client
--     delete flows; a separate migration can add one when product needs it).
-- ============================================================================

DROP POLICY IF EXISTS pause_ai_artifacts_owner_insert ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_insert
  ON public.pause_ai_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pause_instances pi
       WHERE pi.id = pause_ai_artifacts.pause_instance_id
         AND pi.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pause_ai_artifacts_owner_update ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_update
  ON public.pause_ai_artifacts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pause_instances pi
       WHERE pi.id = pause_ai_artifacts.pause_instance_id
         AND pi.user_id = auth.uid()
    )
  );
