import { supabase } from '@/integrations/supabase/client';

export const ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX = ['archive', 'pauses-tab-has-rows'] as const;

/** Disabled / tab-hidden placeholder segment (paired with nonce when enabled). */
export const ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_SEGMENT = '__off__' as const;

export const ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_QUERY_KEY = [
  ...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX,
  ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_SEGMENT,
] as const;

export function archivePausesTabHasRowsQueryKey(userId: string, nonce: number) {
  return [...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX, userId, nonce] as const;
}

/** Prefix for `invalidateQueries` — matches all nonce variants for the user. */
export function archivePausesTabHasRowsQueryPrefix(userId: string) {
  return [...ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX, userId] as const;
}

export async function fetchArchivePausesTabHasRows(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('v_pause_archive_pauses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export function getArchivePausesTabHasRowsQueryOptions(input: {
  userId: string | undefined;
  nonce: number;
  enabled: boolean;
}) {
  const { userId, nonce, enabled } = input;
  return {
    queryKey:
      enabled && userId
        ? archivePausesTabHasRowsQueryKey(userId, nonce)
        : ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_QUERY_KEY,
    queryFn: () => fetchArchivePausesTabHasRows(userId!),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
