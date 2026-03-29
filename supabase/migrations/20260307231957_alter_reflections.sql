ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS learning_citation text,
  ADD COLUMN IF NOT EXISTS learning_url text;

-- Backfill existing reflections: overwrite old static learning data with NULL so History shows nothing for old entries
UPDATE public.reflections SET learning_title = NULL, learning_body = NULL WHERE learning_title IS NOT NULL;