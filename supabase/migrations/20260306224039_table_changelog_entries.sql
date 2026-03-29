
-- Changelog entries table (admin-managed, public read)
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  date text NOT NULL,
  changes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read changelog"
  ON public.changelog_entries FOR SELECT
  USING (true);

-- Roadmap items table (admin-managed, public read)
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned',
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roadmap"
  ON public.roadmap_items FOR SELECT
  USING (true);

-- Roadmap votes table (authenticated users)
CREATE TABLE public.roadmap_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own votes"
  ON public.roadmap_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
