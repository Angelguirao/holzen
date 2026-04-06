-- 1) Recreate the view with grounding COALESCE logic
DROP VIEW IF EXISTS public.v_reflection_with_companions;

CREATE VIEW public.v_reflection_with_companions
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.user_id,
  r.message,
  r.context,
  r.created_at,
  r.is_favorite,
  r.haiku,
  r.outcome,
  r.mood,
  r.note,
  r.tags,
  r.breathing_completed,
  r.haiku_read,
  r.mood_after,
  CASE
    WHEN gc.id IS NOT NULL THEN COALESCE(gc.read, false)
    ELSE r.grounding_read
  END AS grounding_read,
  COALESCE(gc.content ->> 'title', r.grounding_title) AS grounding_title,
  COALESCE(gc.content ->> 'body', r.grounding_body) AS grounding_body,
  sc.content ->> 'title' AS signal_title,
  sc.content ->> 'body' AS signal_body,
  sc.content ->> 'source' AS signal_source,
  sc.content ->> 'url' AS signal_url,
  sc.read AS signal_read,
  sc.content ->> 'title' AS companion_signal_title,
  sc.content ->> 'body' AS companion_signal_body,
  sc.content ->> 'source' AS companion_signal_source,
  sc.content ->> 'url' AS companion_signal_url,
  sc.read AS companion_signal_read,
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  hc.content AS history_insight_data,
  hc.read AS history_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  COALESCE(zc.content, zdt.content) AS zoom_out_data,
  COALESCE(zc.read, zdt.read) AS zoom_out_read,
  COALESCE(zc.content, zdt.content) AS companion_zoom_out_data,
  COALESCE(zc.read, zdt.read) AS companion_zoom_out_read,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'signal'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_signal,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'ground_nudge'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_ground_nudge,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id AND cs.companion_type = 'historical_insight'
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_historical_insight,
  (
    SELECT cs.serve_source
    FROM public.companion_serves cs
    WHERE cs.reflection_id = r.id
      AND cs.companion_type IN ('zoom_out', 'zoom_out_deep_time')
    ORDER BY cs.created_at DESC NULLS LAST
    LIMIT 1
  ) AS serve_source_zoom_out
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out'
LEFT JOIN reflection_companions zdt ON zdt.reflection_id = r.id AND zdt.companion_type = 'zoom_out_deep_time';

-- 2) content_library title_norm + indexes
ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS title_norm text
  GENERATED ALWAYS AS (lower(regexp_replace(trim(title), '\s+', ' ', 'g'))) STORED;

CREATE INDEX IF NOT EXISTS idx_content_library_type_title_norm_active
  ON public.content_library (type, title_norm)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_content_library_url_active
  ON public.content_library (url)
  WHERE active = true AND url IS NOT NULL AND length(trim(url)) > 0;

-- 3) referral_pending_jobs table
CREATE TABLE IF NOT EXISTS public.referral_pending_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid NOT NULL,
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

CREATE INDEX IF NOT EXISTS referral_pending_jobs_pending_due_idx
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