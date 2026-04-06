ALTER TABLE public.companion_serves
  ADD COLUMN IF NOT EXISTS cache_relaxation text;

COMMENT ON COLUMN public.companion_serves.cache_relaxation IS
  'From serveFromCache: none = strict hit; market = dropped regime filter; repeat_or_lower_quality = lower quality or repeat.';