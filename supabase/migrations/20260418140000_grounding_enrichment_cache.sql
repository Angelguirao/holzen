-- Add a shared, content-addressed enrichment cache for Grounding citations.
--
-- Grounding cards surface a 1–2 sentence research nudge with a citation; the
-- companion Full View wants to show extra context (abstract preview, short
-- researcher bios, citation count) that we don't want to regenerate per user.
-- We key by a deterministic SHA-256 of the normalized citation so every user
-- that sees the same paper reuses the same enrichment row.
--
-- Writes flow through the `grounding-enrich` edge function (service-role);
-- reads are open to any authenticated user because the rows contain only
-- public metadata (paper abstracts + academic bios from Crossref / Semantic
-- Scholar / a one-shot Gemini call).
--
-- TTL: `expires_at` defaults to 60 days — academic citation counts drift
-- slowly and abstracts effectively never change, so this keeps API cost
-- at one-fetch-per-paper-per-60-days regardless of user count.

CREATE TABLE IF NOT EXISTS public.grounding_enrichment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  /** sha256 of normalized citation text — deterministic key for upsert */
  citation_hash text NOT NULL UNIQUE,
  /** parsed DOI when the citation or url exposed one; null when we fell back to title/author fuzzy match */
  doi text,
  /** the canonical citation url (may equal the original nudge.url or a resolved DOI url) */
  url text,
  /** 1–2 sentence abstract preview; null when Crossref / Semantic Scholar had no abstract */
  abstract text,
  /** [{ name: string, bio: string }] — bio is one-shot Gemini; kept here so we don't re-pay per user */
  researchers jsonb NOT NULL DEFAULT '[]'::jsonb,
  /** Semantic Scholar citation count when available */
  citation_count int,
  /** { abstract_source: "crossref" | "semantic_scholar" | null, bio_source: "gemini" | null, ... } — helps us audit origin */
  source_provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  /** when the enrichment was last refreshed — null on first write */
  last_validated_at timestamptz,
  /** after this, the edge function treats the row as stale and re-enriches */
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grounding_enrichment_cache_doi
  ON public.grounding_enrichment_cache (doi)
  WHERE doi IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grounding_enrichment_cache_expires_at
  ON public.grounding_enrichment_cache (expires_at);

ALTER TABLE public.grounding_enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Read-only policy: any authenticated user can fetch enrichment. Contents
-- are all public-domain metadata (Crossref / Semantic Scholar), so we do not
-- join against `auth.uid()` here. Anon is blocked.
DROP POLICY IF EXISTS "read grounding enrichment" ON public.grounding_enrichment_cache;
CREATE POLICY "read grounding enrichment"
  ON public.grounding_enrichment_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes (upserts) flow exclusively through the `grounding-enrich` edge
-- function using the service-role key, so we do not create an INSERT/UPDATE
-- policy here. Service role bypasses RLS.

COMMENT ON TABLE public.grounding_enrichment_cache IS
  'Shared, content-addressed cache of enrichment data (abstract, researcher bios, citation count) for Grounding citations shown on the companion Full View. Keyed by sha256(normalized citation). Writes: grounding-enrich edge function (service role). Reads: any authenticated user.';
