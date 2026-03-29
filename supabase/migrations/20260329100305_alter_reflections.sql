-- Drop the columns we just added since code no longer writes to them
ALTER TABLE public.reflections
  DROP COLUMN IF EXISTS grounding_citation,
  DROP COLUMN IF EXISTS grounding_url;