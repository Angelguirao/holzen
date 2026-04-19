CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before JSONB,
  after JSONB,
  cid TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_cid ON public.audit_log (cid);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log admin select" ON public.audit_log;

CREATE POLICY "audit_log admin select"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.audit_log IS 'Security-sensitive state changes. Service role writes, admins read. Never stores PII / reflection content.';
COMMENT ON COLUMN public.audit_log.actor_id IS 'User who initiated the action; NULL for system-driven events (e.g. Stripe webhook).';
COMMENT ON COLUMN public.audit_log.action IS 'Dotted verb, e.g. account.deleted, subscription.updated, admin.override_applied.';
COMMENT ON COLUMN public.audit_log.before IS 'Operational state before the change. Must not include reflection/PII content.';
COMMENT ON COLUMN public.audit_log.after IS 'Operational state after the change. Must not include reflection/PII content.';
COMMENT ON COLUMN public.audit_log.cid IS 'Correlation id (x-cid) from the triggering request — joins to BetterStack logs + Sentry events.';