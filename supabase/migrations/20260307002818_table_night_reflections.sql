CREATE TABLE public.night_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  btc_change_percent numeric NOT NULL,
  btc_direction text NOT NULL,
  had_reflection boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.night_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own night reflections"
  ON public.night_reflections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own night reflections"
  ON public.night_reflections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);