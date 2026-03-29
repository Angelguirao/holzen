-- companion_cache: dashboard bulk delete / promote / demote (was SELECT-only → DELETE returned 204 with 0 rows)
CREATE POLICY "Admins can delete companion cache"
  ON public.companion_cache
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update companion cache"
  ON public.companion_cache
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- signal_sources: admin catalog add/remove (was SELECT-only for end users)
CREATE POLICY "Admins can insert signal sources"
  ON public.signal_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update signal sources"
  ON public.signal_sources
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete signal sources"
  ON public.signal_sources
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
