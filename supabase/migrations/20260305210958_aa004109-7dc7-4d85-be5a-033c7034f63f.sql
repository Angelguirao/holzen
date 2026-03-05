CREATE POLICY "Users can delete their own reflections"
  ON public.reflections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);