-- Allow dashboard admins to remove generation_attempt rows (bulk cleanup of failures).
-- Edge functions use the service role and are unaffected by RLS.
CREATE POLICY "Admins can delete generation attempts"
  ON public.generation_attempts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
