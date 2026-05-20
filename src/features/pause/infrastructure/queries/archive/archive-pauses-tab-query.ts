import { supabase } from '@/integrations/supabase/client';
import {
  ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_QUERY_KEY,
  archivePausesTabHasRowsQueryKey,
} from '@/features/pause/application/queries/archive-pauses-tab-keys';

export {
  ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_QUERY_KEY,
  ARCHIVE_PAUSES_TAB_HAS_ROWS_OFF_SEGMENT,
  ARCHIVE_PAUSES_TAB_HAS_ROWS_QUERY_PREFIX,
  archivePausesTabHasRowsQueryKey,
  archivePausesTabHasRowsQueryPrefix,
} from '@/features/pause/application/queries/archive-pauses-tab-keys';

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
