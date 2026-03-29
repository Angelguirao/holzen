-- signal_sources: exclude from live AI search hints when demoted (admin/user tooling)
ALTER TABLE public.signal_sources
  ADD COLUMN IF NOT EXISTS demoted_for_live boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.signal_sources.demoted_for_live IS 'When true, orchestrator skips this catalog row for live Perplexity-style search (custom prefs still apply).';

-- companion_cache: deprioritize in pool when source is marked untrusted but body kept
ALTER TABLE public.companion_cache
  ADD COLUMN IF NOT EXISTS source_untrusted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.companion_cache.source_untrusted IS 'Admin: keep body in pool but serve trusted rows first.';

CREATE INDEX IF NOT EXISTS idx_companion_cache_trusted_first
  ON public.companion_cache (companion_type, language, source_untrusted, quality_score DESC);
