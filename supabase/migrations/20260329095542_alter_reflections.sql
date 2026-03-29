ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS grounding_citation text,
  ADD COLUMN IF NOT EXISTS grounding_url text;