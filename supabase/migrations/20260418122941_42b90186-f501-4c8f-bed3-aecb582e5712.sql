-- Add a shared, content-addressed enrichment cache for Grounding citations.
CREATE TABLE IF NOT EXISTS public.grounding_enrichment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_hash text NOT NULL UNIQUE,
  doi text,
  url text,
  abstract text,
  researchers jsonb NOT NULL DEFAULT '[]'::jsonb,
  citation_count int,
  source_provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_validated_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grounding_enrichment_cache_doi
  ON public.grounding_enrichment_cache (doi)
  WHERE doi IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grounding_enrichment_cache_expires_at
  ON public.grounding_enrichment_cache (expires_at);

ALTER TABLE public.grounding_enrichment_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read grounding enrichment" ON public.grounding_enrichment_cache;
CREATE POLICY "read grounding enrichment"
  ON public.grounding_enrichment_cache
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE public.grounding_enrichment_cache IS
  'Shared, content-addressed cache of enrichment data (abstract, researcher bios, citation count) for Grounding citations shown on the companion Full View. Keyed by sha256(normalized citation). Writes: grounding-enrich edge function (service role). Reads: any authenticated user.';