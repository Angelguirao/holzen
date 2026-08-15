-- Attribution columns for waitlist signups (X / organic UTM → email).
-- Writes only via waitlist-signup edge (service_role).

ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text;

COMMENT ON COLUMN public.waitlist_signups.utm_source IS
  'utm_source from landing URL (e.g. x).';
COMMENT ON COLUMN public.waitlist_signups.utm_medium IS
  'utm_medium from landing URL (e.g. organic).';
COMMENT ON COLUMN public.waitlist_signups.utm_campaign IS
  'utm_campaign from landing URL (e.g. waitlist).';
COMMENT ON COLUMN public.waitlist_signups.utm_content IS
  'utm_content / creative id (e.g. Holzen X post id).';
COMMENT ON COLUMN public.waitlist_signups.utm_term IS
  'utm_term when present.';

CREATE INDEX IF NOT EXISTS waitlist_signups_utm_source_created_at_idx
  ON public.waitlist_signups (utm_source, created_at DESC);
