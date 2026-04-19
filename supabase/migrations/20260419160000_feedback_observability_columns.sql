-- Observability columns for the feedback table.
--
-- Rationale: incident triage from a user-submitted bug report should be one click:
-- the row now carries the Sentry event id, the PostHog session id, our correlation id,
-- the page where the report was filed, the UA, the app version, and (for error-boundary
-- reports) a truncated stack. None of these fields contain reflection content or PII
-- beyond the existing `message` column (which was already user-authored text).
--
-- Safety:
--   - All columns are nullable so existing rows + clients that haven't been updated keep working.
--   - No behavioral change to existing RLS — admins still own SELECT, users still own INSERT.
--   - `error_stack` is bounded by the client (2000 chars); DB does not enforce a limit, but we
--     intentionally let Postgres compress it via TOAST rather than hard-truncate.
--
-- See docs/ops/pii-masking-review.md § Feedback surfaces and docs/ops/incident-response.md.

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS page TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS sentry_event_id TEXT,
  ADD COLUMN IF NOT EXISTS posthog_session_id TEXT,
  ADD COLUMN IF NOT EXISTS cid TEXT,
  ADD COLUMN IF NOT EXISTS error_stack TEXT,
  ADD COLUMN IF NOT EXISTS app_version TEXT;

-- `cid` is the pivot column across feedback ↔ BetterStack ↔ Sentry, so index it.
CREATE INDEX IF NOT EXISTS idx_feedback_cid ON public.feedback (cid);

COMMENT ON COLUMN public.feedback.page IS 'Path + search of the page where the user submitted feedback.';
COMMENT ON COLUMN public.feedback.user_agent IS 'navigator.userAgent at submission time (informational only).';
COMMENT ON COLUMN public.feedback.sentry_event_id IS 'Sentry event id from an active error boundary (if reported via ErrorBoundary → FeedbackWidget).';
COMMENT ON COLUMN public.feedback.posthog_session_id IS 'PostHog session id for UX pattern correlation — session replay is disabled globally.';
COMMENT ON COLUMN public.feedback.cid IS 'Correlation id generated per tab (x-cid header) — pivot to BetterStack logs + Sentry events.';
COMMENT ON COLUMN public.feedback.error_stack IS 'Truncated error stack trace (max ~2KB from client) when the report was triggered from an error boundary.';
COMMENT ON COLUMN public.feedback.app_version IS 'VITE_APP_VERSION at submission time — normally the Git SHA.';
