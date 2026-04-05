-- Durable queue for referral attribution (client enqueue + cron worker + record-referral HTTP).

CREATE TABLE public.referral_pending_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 10,
  last_error text,
  next_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

CREATE INDEX referral_pending_jobs_pending_due_idx
  ON public.referral_pending_jobs (created_at)
  WHERE status = 'pending'
    AND attempts < max_attempts;

ALTER TABLE public.referral_pending_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own referral_pending_jobs"
  ON public.referral_pending_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Users select own referral_pending_jobs"
  ON public.referral_pending_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

CREATE TRIGGER update_referral_pending_jobs_updated_at
  BEFORE UPDATE ON public.referral_pending_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.referral_pending_jobs IS
  'Queue row per referred user; service role + claim_referral_pending_jobs process pending items.';

-- Atomically claim rows for the worker (SKIP LOCKED). Service role only.
CREATE OR REPLACE FUNCTION public.claim_referral_pending_jobs(p_limit integer DEFAULT 15)
RETURNS SETOF public.referral_pending_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT j.id
    FROM public.referral_pending_jobs j
    WHERE j.status = 'pending'
      AND j.attempts < j.max_attempts
      AND (j.next_attempt_at IS NULL OR j.next_attempt_at <= now())
    ORDER BY j.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.referral_pending_jobs j
  SET status = 'processing', updated_at = now()
  FROM picked
  WHERE j.id = picked.id
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_pending_jobs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral_pending_jobs(integer) TO service_role;
