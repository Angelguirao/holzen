ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS page TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS sentry_event_id TEXT,
  ADD COLUMN IF NOT EXISTS posthog_session_id TEXT,
  ADD COLUMN IF NOT EXISTS cid TEXT,
  ADD COLUMN IF NOT EXISTS error_stack TEXT,
  ADD COLUMN IF NOT EXISTS app_version TEXT;

CREATE INDEX IF NOT EXISTS idx_feedback_cid ON public.feedback (cid);

COMMENT ON COLUMN public.feedback.page IS 'Path + search of the page where the user submitted feedback.';
COMMENT ON COLUMN public.feedback.user_agent IS 'navigator.userAgent at submission time (informational only).';
COMMENT ON COLUMN public.feedback.sentry_event_id IS 'Sentry event id from an active error boundary (if reported via ErrorBoundary → FeedbackWidget).';
COMMENT ON COLUMN public.feedback.posthog_session_id IS 'PostHog session id for UX pattern correlation — session replay is disabled globally.';
COMMENT ON COLUMN public.feedback.cid IS 'Correlation id generated per tab (x-cid header) — pivot to BetterStack logs + Sentry events.';
COMMENT ON COLUMN public.feedback.error_stack IS 'Truncated error stack trace (max ~2KB from client) when the report was triggered from an error boundary.';
COMMENT ON COLUMN public.feedback.app_version IS 'VITE_APP_VERSION at submission time — normally the Git SHA.';