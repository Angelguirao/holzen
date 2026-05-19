import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  updateProfileSnoozedUntil,
  type ProfileRow,
} from '@/features/user/public-queries';

export function useSnooze() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { data: profileRow } = useQuery(getProfileRowQueryOptions(userId));

  const snoozedUntil = useMemo(() => {
    const val = profileRow?.snoozed_until;
    if (!val) return null;
    const d = new Date(val);
    return d > new Date() ? d : null;
  }, [profileRow?.snoozed_until]);

  const bumpProfileCache = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [queryClient, userId]);

  const snooze = useCallback(
    async (hours: number) => {
      if (!userId) return;
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      const iso = until.toISOString();
      queryClient.setQueryData<ProfileRow | null>(PROFILE_QUERY_KEY(userId), (prev) =>
        prev ? { ...prev, snoozed_until: iso } : prev,
      );
      const { error } = await updateProfileSnoozedUntil(userId, iso);
      if (!error) bumpProfileCache();
      else void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
    },
    [userId, queryClient, bumpProfileCache],
  );

  const cancelSnooze = useCallback(async () => {
    if (!userId) return;
    queryClient.setQueryData<ProfileRow | null>(PROFILE_QUERY_KEY(userId), (prev) =>
      prev ? { ...prev, snoozed_until: null } : prev,
    );
    const { error } = await updateProfileSnoozedUntil(userId, null);
    if (!error) bumpProfileCache();
    else void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [userId, queryClient, bumpProfileCache]);

  const isActive = snoozedUntil ? snoozedUntil > new Date() : false;

  return { snoozedUntil, isActive, snooze, cancelSnooze };
}
