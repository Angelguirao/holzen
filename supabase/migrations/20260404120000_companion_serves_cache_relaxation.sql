-- Persist companion_cache serve tier when `serveFromCache` used a relaxed pass (analytics + optional UI).

ALTER TABLE public.companion_serves
  ADD COLUMN IF NOT EXISTS cache_relaxation text
  CHECK (
    cache_relaxation IS NULL
    OR cache_relaxation IN ('none', 'market', 'repeat_or_lower_quality')
  );

COMMENT ON COLUMN public.companion_serves.cache_relaxation IS
  'From serveFromCache: none = strict hit; market = dropped regime filter; repeat_or_lower_quality = lower quality or repeat.';
