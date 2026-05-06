import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getProfileRowQueryOptions } from '@/hooks/use-profile';

function isAdminFromEnvList(userId: string): boolean {
  const ids = import.meta.env.VITE_ADMIN_USER_IDS as string | undefined;
  if (!ids) return false;
  return ids.split(',').some((s) => s.trim() === userId);
}

/**
 * Client-side admin gate for internal /ops pages (aligns with `profiles.is_admin` / RLS).
 * When the column is null or unreadable, falls back to `VITE_ADMIN_USER_IDS` (same behavior as legacy call sites).
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
    if (status === 'success' && profileRow && typeof profileRow.is_admin === 'boolean') {
      return { isAdmin: profileRow.is_admin, resolvingProfile: false };
    }
    return { isAdmin: isAdminFromEnvList(userId), resolvingProfile: false };
  }, [userId, status, profileRow]);

  return {
    isAdmin,
    loading: authLoading || resolvingProfile,
  };
}
