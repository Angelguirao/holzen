
-- Create a table to cache high-quality companion content for fallback
CREATE TABLE public.companion_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_type text NOT NULL, -- 'ground_nudge', 'signal', 'zoom_out_deep_time', 'historical_insight'
  language text NOT NULL DEFAULT 'en',
  content jsonb NOT NULL,
  quality_score integer NOT NULL DEFAULT 1, -- 1=ok, 2=good, 3=great (verified URL, specific data)
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companion_cache ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (fallback content is shared)
CREATE POLICY "Authenticated users can read companion cache"
  ON public.companion_cache FOR SELECT TO authenticated
  USING (true);

-- Index for fast lookup by type + language + quality
CREATE INDEX idx_companion_cache_lookup 
  ON public.companion_cache (companion_type, language, quality_score DESC);
