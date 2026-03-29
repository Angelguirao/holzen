-- Human-in-the-loop: AI live generations can enqueue catalog candidates for admin review
-- before inserting into signal_sources.

CREATE TABLE IF NOT EXISTS public.signal_source_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('signal', 'grounding')),
  suggested_name text NOT NULL,
  suggested_url text,
  suggested_type text NOT NULL DEFAULT 'blog',
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

COMMENT ON TABLE public.signal_source_suggestions IS 'Pending catalog additions derived from live Signal/Grounding generations; admins approve into signal_sources.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_source_suggestions_pending_dedupe
  ON public.signal_source_suggestions (dedupe_key)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_signal_source_suggestions_status_created
  ON public.signal_source_suggestions (status, created_at DESC);

ALTER TABLE public.signal_source_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select signal_source_suggestions"
  ON public.signal_source_suggestions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert signal_source_suggestions"
  ON public.signal_source_suggestions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update signal_source_suggestions"
  ON public.signal_source_suggestions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete signal_source_suggestions"
  ON public.signal_source_suggestions FOR DELETE TO authenticated
  USING (public.is_admin());

-- Service role (edge) inserts pending rows without JWT — default deny for anon/auth;
-- edge uses service role and bypasses RLS.
