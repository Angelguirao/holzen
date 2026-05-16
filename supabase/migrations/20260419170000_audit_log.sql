-- Audit log for security-sensitive state changes.
--
-- What goes here (see docs/ops/edge-logging-conventions.md § Audit log):
--   - Account deletion (delete-account)
--   - Admin overrides (any admin-only mutation on another user's data)
--   - Subscription state transitions driven by the Stripe webhook
--   - Role/permission changes
--   - Any action a regulator or on-call reviewer would want a record of
--
-- What does NOT go here:
--   - Ordinary user CRUD (reflections, library items, practice entries)
--   - Bulk imports or migrations (they are tracked via `supabase/migrations/` itself)
--   - Anything that would require storing reflection content or PII
--
-- RLS:
--   - Service role inserts (all edge functions using the helper).
--   - Admins can SELECT everything.
--   - Non-admins cannot see this table at all (no self-SELECT — audit must be tamper-resistant
--     from the user's own session even if they're the actor).

CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,                -- the user (or NULL for system-triggered events)
  action TEXT NOT NULL,         -- e.g. 'account.deleted', 'subscription.updated'
  target_type TEXT,             -- e.g. 'user', 'subscription'
  target_id TEXT,               -- UUID / Stripe id / etc — TEXT so we don't have to know
  before JSONB,                 -- prior non-PII state (or NULL)
  after JSONB,                  -- new non-PII state (or NULL)
  cid TEXT,                     -- correlation id from the triggering request, for pivoting
  metadata JSONB                -- free-form structured context (function name, reason, etc.)
);

-- Indexes aimed at typical triage queries: "show me recent admin actions", "who changed this
-- subscription", "what happened to user X around time Y".
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_cid ON public.audit_log (cid);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Drop-and-recreate so the migration is idempotent if re-run on a reset DB.
DROP POLICY IF EXISTS "audit_log admin select" ON public.audit_log;

-- Admin-only SELECT. `public.is_admin()` is the existing helper (migration
-- 20260328115647_function_is_admin.sql) — it reads `auth.uid()` internally.
CREATE POLICY "audit_log admin select"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- No INSERT / UPDATE / DELETE policies: only the service role can write. Users — including
-- admins — never modify audit rows through PostgREST. This keeps the log tamper-resistant.

COMMENT ON TABLE public.audit_log IS 'Security-sensitive state changes. Service role writes, admins read. Never stores PII / reflection content.';
COMMENT ON COLUMN public.audit_log.actor_id IS 'User who initiated the action; NULL for system-driven events (e.g. Stripe webhook).';
COMMENT ON COLUMN public.audit_log.action IS 'Dotted verb, e.g. account.deleted, subscription.updated, admin.override_applied.';
COMMENT ON COLUMN public.audit_log.before IS 'Operational state before the change. Must not include reflection/PII content.';
COMMENT ON COLUMN public.audit_log.after IS 'Operational state after the change. Must not include reflection/PII content.';
COMMENT ON COLUMN public.audit_log.cid IS 'Correlation id (x-cid) from the triggering request — joins to BetterStack logs + Sentry events.';
