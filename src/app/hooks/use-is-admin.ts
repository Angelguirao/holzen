import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { getProfileRowQueryOptions } from '@/features/user/public-queries';

/**
 * Client-side admin gate for internal /ops pages (aligns with `profiles.is_admin` / RLS).
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const { data: profileRow, status } = useQuery(getProfileRowQueryOptions(userId));

  const { isAdmin, resolvingProfile } = useMemo(() => {
    if (!userId) {
      return { isAdmin: false, resolvingProfile: false };
    }
    if (status !== 'success' && status !== 'error') {
      return { isAdmin: false, resolvingProfile: true };
    }
    return { isAdmin: profileRow?.is_admin === true, resolvingProfile: false };
  }, [userId, status, profileRow]);

  return {
    isAdmin,
    loading: authLoading || resolvingProfile,
  };
}
