
CREATE TABLE public.ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reflection_id UUID REFERENCES public.reflections(id) ON DELETE SET NULL,
  template TEXT NOT NULL DEFAULT 'standard',
  decision TEXT NOT NULL,
  journal_text TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own ritual completions"
  ON public.ritual_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ritual completions"
  ON public.ritual_completions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ritual completions"
  ON public.ritual_completions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
