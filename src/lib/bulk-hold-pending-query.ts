import { keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  bulkHoldMaxRows,
  bulkHoldQueryWindowIso,
  type BulkHoldPendingPause,
} from '@/lib/bulk-hold';

export const PAUSE_BULK_HOLD_QUERY_PREFIX = ['pause', 'bulk-hold'] as const;

export const BULK_HOLD_PENDING_QUERY_LEAF = 'pending' as const;

export const BULK_HOLD_PENDING_QUERY_PREFIX = [
  ...PAUSE_BULK_HOLD_QUERY_PREFIX,
  BULK_HOLD_PENDING_QUERY_LEAF,
] as const;

/** Signed-out / disabled user segment (paired with `refetchNonce` in none-keys). */
export const BULK_HOLD_PENDING_DISABLED_USER_ID = 'none' as const;

export function bulkHoldPendingNoneQueryKey(refetchNonce: number) {
  return [
    ...BULK_HOLD_PENDING_QUERY_PREFIX,
    BULK_HOLD_PENDING_DISABLED_USER_ID,
    refetchNonce,
  ] as const;
}

export function bulkHoldPendingQueryKey(userId: string, refetchNonce: number) {
  return [...BULK_HOLD_PENDING_QUERY_PREFIX, userId, refetchNonce] as const;
}

export async function fetchBulkHoldPendingPauses(userId: string): Promise<BulkHoldPendingPause[]> {
  const windowStart = bulkHoldQueryWindowIso();
  const { data } = await supabase
    .from('pause_instances' as never)
    .select('id, created_at, context_snapshot')
    .eq('user_id', userId)
    .eq('state', 'expired')
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(bulkHoldMaxRows);

  const rows = (data ?? []) as BulkHoldPendingPause[];
  if (rows.length < 2) {
    return [];
  }

  const { data: outcomes } = await supabase
    .from('pause_step_events' as never)
    .select('pause_instance_id')
    .eq('user_id', userId)
    .eq('step_type', 'outcome_logged')
    .in(
      'pause_instance_id',
      rows.map((r) => r.id),
    );

  const withOutcome = new Set(
    ((outcomes ?? []) as Array<{ pause_instance_id: string }>).map((o) => o.pause_instance_id),
  );

  return rows
    .filter((r) => !withOutcome.has(r.id))
    .map((r) => ({
      ...r,
      context_snapshot: (r as { context_snapshot?: Record<string, unknown> | null }).context_snapshot ?? null,
    }));
}

export function getBulkHoldPendingQueryOptions(opts: {
  userId: string | undefined;
  fetchEnabled: boolean;
  refetchNonce: number;
}) {
  const { userId, fetchEnabled, refetchNonce } = opts;
  return {
    queryKey: userId ? bulkHoldPendingQueryKey(userId, refetchNonce) : bulkHoldPendingNoneQueryKey(refetchNonce),
    queryFn: () => fetchBulkHoldPendingPauses(userId!),
    enabled: Boolean(userId) && fetchEnabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: keepPreviousData,
  } as const;
}
