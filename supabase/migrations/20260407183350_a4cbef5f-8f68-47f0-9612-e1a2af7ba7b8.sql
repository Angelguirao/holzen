ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS original_url text,
  ADD COLUMN IF NOT EXISTS original_publication text;

COMMENT ON COLUMN public.content_library.original_url IS
  'Canonical / first-publication URL when different from url (e.g. Substack original).';
COMMENT ON COLUMN public.content_library.original_publication IS
  'Human label for the original outlet (e.g. The Bitstein Brief).';

ALTER TABLE public.signal_sources
  ADD COLUMN IF NOT EXISTS last_fetch_feeds_at timestamptz;

COMMENT ON COLUMN public.signal_sources.last_fetch_feeds_at IS
  'Updated when fetch-source-feeds finishes processing this source (success path). Null = never fetched.';

CREATE INDEX IF NOT EXISTS idx_signal_sources_last_fetch_feeds_at
  ON public.signal_sources (last_fetch_feeds_at NULLS FIRST)
  WHERE demoted_for_live = false AND url IS NOT NULL;