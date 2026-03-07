CREATE TABLE public.reflection_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  reflection_count integer NOT NULL DEFAULT 0,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reflection_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON public.reflection_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON public.reflection_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.reflection_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);