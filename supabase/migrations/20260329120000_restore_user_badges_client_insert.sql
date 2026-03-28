-- Client badge persistence (use-badge-sync.ts) inserts rows when computed badges
-- are earned. Migration 20260317215158 dropped the INSERT policy without moving
-- that write path to an edge function, which caused RLS 42501 on the Badges tab.
-- Re-allow authenticated users to insert only their own rows (same as original
-- 20260308034929 policy).

DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
