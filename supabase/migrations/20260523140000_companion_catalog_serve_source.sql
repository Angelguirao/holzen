-- Allow `catalog` serve_source for companion_catalog phase (companion_serves telemetry).
-- Keeps `library` for historical rows emitted before the rename.

ALTER TABLE public.companion_serves
  DROP CONSTRAINT IF EXISTS companion_serves_serve_source_check;

ALTER TABLE public.companion_serves
  ADD CONSTRAINT companion_serves_serve_source_check
  CHECK (serve_source IN ('live', 'library', 'catalog', 'cache', 'curated', 'empty'));

COMMENT ON COLUMN public.companion_serves.serve_source IS
  'Where the served row came from: live (AI), catalog (companion_catalog), library (legacy label for catalog), cache (companion_cache), curated (fallback pool), empty (all tiers failed).';
