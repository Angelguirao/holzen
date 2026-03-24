CREATE TABLE IF NOT EXISTS content_library (
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING gin(tags) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_companion ON content_library USING gin(companion_types) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_mood ON content_library(mood_tag) WHERE type = 'event' AND active = true;

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content library"
  ON content_library FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read content library"
  ON content_library FOR SELECT
  TO authenticated
  USING (true);