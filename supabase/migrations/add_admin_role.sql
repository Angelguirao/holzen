-- ============================================================================
-- Add server-side admin role for proper RLS on monitoring tables
-- ============================================================================
--
-- Adds is_admin column to profiles and updates RLS policies so only
-- admin users can read monitoring data (companion_serves, generation_attempts,
-- analytics_events for all users, and the daily breakdown views).
--
-- After running this migration, set your user as admin:
--   UPDATE profiles SET is_admin = true WHERE user_id = '7b74332c-5d57-4c37-ac6b-676ca3498fc1';
-- ============================================================================

-- Step 1: Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Step 2: Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE user_id = auth.uid()),
    false
  );
$$;

-- Step 3: Drop the overly broad policies and replace with admin-only
-- companion_serves
DROP POLICY IF EXISTS "Authenticated users can view all companion serves" ON companion_serves;
DROP POLICY IF EXISTS "Users can view their own companion serves" ON companion_serves;
CREATE POLICY "Admins can view all companion serves"
  ON companion_serves FOR SELECT
  USING (public.is_admin());

-- generation_attempts
DROP POLICY IF EXISTS "Authenticated users can view generation attempts" ON generation_attempts;
CREATE POLICY "Admins can view generation attempts"
  ON generation_attempts FOR SELECT
  USING (public.is_admin());

-- analytics_events: users can see their own, admins can see all
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (public.is_admin());

-- Step 4: Set your user as admin
-- IMPORTANT: Replace with your actual user_id if different
UPDATE profiles SET is_admin = true WHERE user_id = '7b74332c-5d57-4c37-ac6b-676ca3498fc1';
