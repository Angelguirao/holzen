
-- Practice entries for emotional check-ins, journals, body scans, and reflection replays
CREATE TABLE public.practice_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'checkin', -- checkin, journal, bodyscan, replay
  mood TEXT,
  intensity INTEGER, -- 1-5 scale
  trigger_text TEXT,
  body TEXT,
  prompt TEXT,
  source_reflection_id UUID REFERENCES public.reflections(id) ON DELETE SET NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own practice entries"
  ON public.practice_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own practice entries"
  ON public.practice_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice entries"
  ON public.practice_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
