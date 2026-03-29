-- Catalog of pre-defined signal sources
CREATE TABLE public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'blog',
  url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read signal sources"
  ON public.signal_sources FOR SELECT
  USING (true);

-- User preferences: toggles for catalog sources + custom sources
CREATE TABLE public.user_signal_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_id uuid REFERENCES public.signal_sources(id) ON DELETE CASCADE,
  custom_name text,
  custom_url text,
  custom_type text DEFAULT 'blog',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_source UNIQUE(user_id, source_id)
);

ALTER TABLE public.user_signal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own signal preferences"
  ON public.user_signal_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);