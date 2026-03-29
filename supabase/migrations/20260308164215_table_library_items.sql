
-- Library items: unified table for bookmarks, notes, clippings
CREATE TABLE public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'bookmark',
  title text,
  body text,
  source_type text,
  source_url text,
  reflection_id uuid REFERENCES public.reflections(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own library items"
  ON public.library_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_library_items_user ON public.library_items(user_id);
CREATE INDEX idx_library_items_type ON public.library_items(user_id, type);
CREATE INDEX idx_library_items_reflection ON public.library_items(reflection_id);
CREATE INDEX idx_library_items_tags ON public.library_items USING gin(tags);

-- Collections: named groups
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own collections"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_collections_user ON public.collections(user_id);

-- Collection items: many-to-many join
CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  library_item_id uuid NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, library_item_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check collection ownership
CREATE OR REPLACE FUNCTION public.owns_collection(_user_id uuid, _collection_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = _collection_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Users manage own collection items"
  ON public.collection_items FOR ALL
  USING (public.owns_collection(auth.uid(), collection_id))
  WITH CHECK (public.owns_collection(auth.uid(), collection_id));

CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_library ON public.collection_items(library_item_id);
