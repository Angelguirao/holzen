-- Follow-up system: tracks whether decisions held 24h after a pause
CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reflection_id uuid NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  original_decision text NOT NULL,
  decision_held boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(reflection_id)
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follow-ups"
  ON public.follow_ups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON public.follow_ups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient cron lookups
CREATE INDEX idx_follow_ups_pending ON public.follow_ups (user_id) WHERE decision_held IS NULL;