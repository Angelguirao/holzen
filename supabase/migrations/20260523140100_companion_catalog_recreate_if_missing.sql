-- Safety net when cutover ran with DROP content_library before rename fix.
-- No-op when companion_catalog already exists (rename path or fresh install).

CREATE TABLE IF NOT EXISTS public.companion_catalog (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('essay', 'paper', 'event')),
  title text NOT NULL,
  author text,
  summary text NOT NULL,
  url text,
  key_quote text,
  citation text,
  finding text,
  event_date text,
  asset_class text,
  analogy text,
  recovery text,
  mood_tag text CHECK (mood_tag IN ('recovery', 'caution', 'neutral')),
  tags text[] DEFAULT '{}',
  companion_types text[] DEFAULT '{}',
  language text DEFAULT 'en',
  quality_score integer DEFAULT 2,
  active boolean DEFAULT true,
  original_url text,
  original_publication text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.companion_catalog
  ADD COLUMN IF NOT EXISTS title_norm text
  GENERATED ALWAYS AS (lower(regexp_replace(trim(title), '\s+', ' ', 'g'))) STORED;

CREATE INDEX IF NOT EXISTS idx_companion_catalog_type ON public.companion_catalog(type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_companion_catalog_tags ON public.companion_catalog USING gin(tags) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_companion_catalog_companion ON public.companion_catalog USING gin(companion_types) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_companion_catalog_mood ON public.companion_catalog(mood_tag) WHERE type = 'event' AND active = true;
CREATE INDEX IF NOT EXISTS idx_companion_catalog_type_title_norm_active
  ON public.companion_catalog (type, title_norm)
  WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_companion_catalog_url_active
  ON public.companion_catalog (url)
  WHERE active = true AND url IS NOT NULL AND length(trim(url)) > 0;

ALTER TABLE public.companion_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage content library" ON public.companion_catalog;
DROP POLICY IF EXISTS "Authenticated users can read content library" ON public.companion_catalog;
DROP POLICY IF EXISTS "Admins can manage companion catalog" ON public.companion_catalog;
DROP POLICY IF EXISTS "Authenticated users can read companion catalog" ON public.companion_catalog;

CREATE POLICY "Admins can manage companion catalog"
  ON public.companion_catalog FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read companion catalog"
  ON public.companion_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.companion_catalog IS
  'Curated essays, papers, and events for companion catalog phase (recreate path when content_library was dropped).';
