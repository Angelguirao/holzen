-- Allow admins to read all users' reflections in the admin dashboard.
-- The existing "Users can view their own reflections" policy covers regular users;
-- this policy adds an OR branch for admins so the admin stats hook can query
-- cross-user session data without bypassing RLS via the service role.
CREATE POLICY "Admins can view all reflections"
  ON public.reflections
  FOR SELECT
  USING (public.is_admin());
