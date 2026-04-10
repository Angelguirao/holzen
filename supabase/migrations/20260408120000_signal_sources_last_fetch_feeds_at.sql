-- Fair rotation for fetch-source-feeds: process stalest sources first across cron runs.
ALTER TABLE public.signal_sources
  ADD COLUMN IF NOT EXISTS last_fetch_feeds_at timestamptz;

COMMENT ON COLUMN public.signal_sources.last_fetch_feeds_at IS
  'Updated when fetch-source-feeds finishes processing this source (success path). Null = never fetched.';

CREATE INDEX IF NOT EXISTS idx_signal_sources_last_fetch_feeds_at
  ON public.signal_sources (last_fetch_feeds_at NULLS FIRST)
  WHERE demoted_for_live = false AND url IS NOT NULL;
