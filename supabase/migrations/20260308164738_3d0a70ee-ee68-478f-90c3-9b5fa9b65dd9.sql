
-- Explicit connections between any two entities (reflections, library items, etc.)
CREATE TABLE public.graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_id, target_id)
);

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own graph edges"
  ON public.graph_edges FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_graph_edges_user ON public.graph_edges(user_id);
CREATE INDEX idx_graph_edges_source ON public.graph_edges(source_type, source_id);
CREATE INDEX idx_graph_edges_target ON public.graph_edges(target_type, target_id);
