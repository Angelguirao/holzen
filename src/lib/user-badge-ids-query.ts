import { supabase } from '@/integrations/supabase/client';

/** TanStack cache for `user_badges.badge_id` rows (badge sync + celebrations). */
export const USER_BADGE_IDS_QUERY_PREFIX = ['user-badges', 'badge-ids'] as const;

export const USER_BADGE_IDS_DISABLED_USER_ID = '__none__' as const;

export const USER_BADGE_IDS_NONE_QUERY_KEY = [
  ...USER_BADGE_IDS_QUERY_PREFIX,
  USER_BADGE_IDS_DISABLED_USER_ID,
] as const;

export function userBadgesIdsQueryKey(userId: string) {
  return [...USER_BADGE_IDS_QUERY_PREFIX, userId] as const;
}

export async function fetchUserBadgeIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_badges' as never)
    .select('badge_id')
    .eq('user_id', userId);
  if (error) throw error;
  return ((data ?? []) as Array<{ badge_id: string }>).map((b) => b.badge_id);
}

/**
 * Loads persisted badge grants for sync (`useBadgeSync`). Caller supplies the full
 * `enabled` gate (not only `userId`).
 */
export function getUserBadgeIdsQueryOptions(params: {
  userId: string | undefined;
  enabled: boolean;
}) {
  const { userId, enabled } = params;
  return {
    queryKey: userId ? userBadgesIdsQueryKey(userId) : USER_BADGE_IDS_NONE_QUERY_KEY,
    queryFn: () => fetchUserBadgeIds(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  } as const;
}
