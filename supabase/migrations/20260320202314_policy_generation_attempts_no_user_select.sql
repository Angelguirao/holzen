
-- generation_attempts is service-role only (edge functions write, no user reads)
-- Add a restrictive SELECT policy to satisfy the linter
CREATE POLICY "No direct user access"
  ON public.generation_attempts FOR SELECT
  TO authenticated
  USING (false);
