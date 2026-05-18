ALTER TABLE public.companion_serves DROP CONSTRAINT IF EXISTS companion_serves_serve_source_check;
ALTER TABLE public.companion_serves ADD CONSTRAINT companion_serves_serve_source_check
  CHECK (serve_source IN ('live','library','catalog','cache','curated','empty'));