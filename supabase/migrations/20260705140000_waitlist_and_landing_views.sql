-- Marketing waitlist + lightweight /welcome view counts for venture experiments.
-- Writes only via edge functions (service_role). No anon/authenticated policies.

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'welcome',
  ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.waitlist_signups IS
  'Email waitlist from Astro marketing pages. Inserts via waitlist-signup edge only.';

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_lower_idx
  ON public.waitlist_signups (lower(email));

CREATE INDEX IF NOT EXISTS waitlist_signups_created_at_idx
  ON public.waitlist_signups (created_at DESC);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.landing_daily_views (
  day date PRIMARY KEY,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0)
);

COMMENT ON TABLE public.landing_daily_views IS
  'UTC daily /welcome page-view counter — incremented by landing-ping edge only.';

ALTER TABLE public.landing_daily_views ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_landing_views(p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.landing_daily_views (day, view_count)
  VALUES (p_day, 1)
  ON CONFLICT (day) DO UPDATE
  SET view_count = public.landing_daily_views.view_count + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_landing_views(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_landing_views(date) TO service_role;
