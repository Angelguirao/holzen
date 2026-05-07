import { supabase } from '@/integrations/supabase/client';

/** Row shape used by quiet-windows UI (subset of `quiet_windows` select('*')). */
export interface QuietWindow {
  id: string;
  label: string;
  start_hour: number;
  end_hour: number;
  days: number[];
  active: boolean;
}

export const QUIET_WINDOWS_NONE_QUERY_KEY = ['quiet-windows', 'none'] as const;

export function quietWindowsQueryKey(userId: string) {
  return ['quiet-windows', userId] as const;
}

export async function fetchQuietWindows(userId: string): Promise<QuietWindow[]> {
  const { data, error } = await supabase
    .from('quiet_windows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) {
    console.error('[quiet-windows] load failed:', error.message);
    return [];
  }
  return (data ?? []) as QuietWindow[];
}

export function getQuietWindowsQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? quietWindowsQueryKey(userId) : QUIET_WINDOWS_NONE_QUERY_KEY,
    queryFn: () => fetchQuietWindows(userId!),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  } as const;
}
