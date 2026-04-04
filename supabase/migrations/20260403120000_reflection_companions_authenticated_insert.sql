-- Allow authenticated users to INSERT companion rows for their own reflections.
-- Required for client upsert after manual holzen-reflect (mirrors writeCompanionData
-- ground_nudge upsert). UPDATE-only policy blocked PostgREST upsert inserts.

DROP POLICY IF EXISTS "Users can insert their own companion data" ON public.reflection_companions;

CREATE POLICY "Users can insert their own companion data"
  ON public.reflection_companions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reflection_id IN (SELECT id FROM public.reflections WHERE user_id = auth.uid())
  );
