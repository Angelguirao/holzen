import { useCallback, useMemo, useOptimistic } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  updateProfileSnoozedUntil,
} from '@/features/user/public-queries';

export function useSnooze() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { data: profileRow } = useQuery(getProfileRowQueryOptions(userId));

  const snoozedUntilCommitted = useMemo(() => {
    const val = profileRow?.snoozed_until;
    if (!val) return null;
    const d = new Date(val);
    return d > new Date() ? d : null;
  }, [profileRow?.snoozed_until]);

  const [snoozedUntil, addOptimisticSnoozedUntil] = useOptimistic(
    snoozedUntilCommitted,
    (_current, next: Date | null) => next,
  );

  const bumpProfileCache = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [queryClient, userId]);

  const snoozeUntil = useCallback(
    async (until: Date) => {
      if (!userId || until <= new Date()) return;
      addOptimisticSnoozedUntil(until);
      const iso = until.toISOString();
      const { error } = await updateProfileSnoozedUntil(userId, iso);
      if (!error) bumpProfileCache();
      else void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
    },
    [userId, addOptimisticSnoozedUntil, bumpProfileCache, queryClient],
  );

  const snooze = useCallback(
    async (hours: number) => {
      await snoozeUntil(new Date(Date.now() + hours * 60 * 60 * 1000));
    },
    [snoozeUntil],
  );

  const cancelSnooze = useCallback(async () => {
    if (!userId) return;
    addOptimisticSnoozedUntil(null);
    const { error } = await updateProfileSnoozedUntil(userId, null);
    if (!error) bumpProfileCache();
    else void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [userId, addOptimisticSnoozedUntil, bumpProfileCache, queryClient]);

  const isActive = snoozedUntil ? snoozedUntil > new Date() : false;

  return { snoozedUntil, isActive, snooze, snoozeUntil, cancelSnooze };
}
