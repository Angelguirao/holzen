DROP POLICY IF EXISTS "Users can insert their own companion data" ON public.reflection_companions;

CREATE POLICY "Users can insert their own companion data"
  ON public.reflection_companions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reflection_id IN (SELECT id FROM public.reflections WHERE user_id = auth.uid())
  );