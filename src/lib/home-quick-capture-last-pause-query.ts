import { supabase } from '@/integrations/supabase/client';

export interface HomeQuickCaptureLastPauseRow {
  id: string;
  created_at: string | null;
  terminal_at: string | null;
}

export const HOME_QUICK_CAPTURE_LAST_PAUSE_QUERY_PREFIX = ['home', 'quick-capture', 'last-pause'] as const;

export const HOME_QUICK_CAPTURE_LAST_PAUSE_DISABLED_USER_ID = 'none' as const;

export const HOME_QUICK_CAPTURE_LAST_PAUSE_NONE_QUERY_KEY = [
  ...HOME_QUICK_CAPTURE_LAST_PAUSE_QUERY_PREFIX,
  HOME_QUICK_CAPTURE_LAST_PAUSE_DISABLED_USER_ID,
] as const;

export function homeQuickCaptureLastPauseQueryKey(userId: string) {
  return [...HOME_QUICK_CAPTURE_LAST_PAUSE_QUERY_PREFIX, userId] as const;
}

export async function fetchLastPauseForQuickCapture(userId: string): Promise<HomeQuickCaptureLastPauseRow | null> {
  const { data, error } = await supabase
    .from('v_pause_full' as never)
    .select('id, created_at, terminal_at')
    .eq('user_id', userId)
    .order('terminal_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as HomeQuickCaptureLastPauseRow | null) ?? null;
}

export function getHomeQuickCaptureLastPauseQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? homeQuickCaptureLastPauseQueryKey(userId) : HOME_QUICK_CAPTURE_LAST_PAUSE_NONE_QUERY_KEY,
    queryFn: () => fetchLastPauseForQuickCapture(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
