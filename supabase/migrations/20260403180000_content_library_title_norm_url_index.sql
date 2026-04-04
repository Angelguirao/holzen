-- Stronger content_library dedup for fetch-source-feeds: indexed normalized title + URL lookups.
-- title_norm matches JS normalizeTitleKey() in supabase/functions/_shared/content-dedup.ts

ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS title_norm text
  GENERATED ALWAYS AS (lower(regexp_replace(trim(title), '\s+', ' ', 'g'))) STORED;

CREATE INDEX IF NOT EXISTS idx_content_library_type_title_norm_active
  ON public.content_library (type, title_norm)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_content_library_url_active
  ON public.content_library (url)
  WHERE active = true AND url IS NOT NULL AND length(trim(url)) > 0;
