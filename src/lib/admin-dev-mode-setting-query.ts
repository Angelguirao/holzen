import { supabase } from '@/integrations/supabase/client';
import { ADMIN_QUERY_PREFIX } from '@/lib/admin-query-namespace';

export function readLocalDevMode(): boolean {
  try {
    return localStorage.getItem('holzen_dev_mode') === 'true';
  } catch {
    return false;
  }
}

export const ADMIN_DEV_MODE_SETTING_QUERY_PREFIX = [...ADMIN_QUERY_PREFIX, 'dev-mode-setting'] as const;

export const ADMIN_DEV_MODE_SETTING_DISABLED_USER_ID = 'none' as const;

export const ADMIN_DEV_MODE_SETTING_NONE_QUERY_KEY = [
  ...ADMIN_DEV_MODE_SETTING_QUERY_PREFIX,
  ADMIN_DEV_MODE_SETTING_DISABLED_USER_ID,
] as const;

export function adminDevModeSettingQueryKey(userId: string) {
  return [...ADMIN_DEV_MODE_SETTING_QUERY_PREFIX, userId] as const;
}

export async function fetchDevModeFromAnalytics(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event', 'dev_mode_setting')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) {
    return readLocalDevMode();
  }
  const metadata = data[0].metadata as { enabled?: boolean } | null;
  const dbValue = metadata?.enabled === true;
  try {
    if (dbValue) localStorage.setItem('holzen_dev_mode', 'true');
    else localStorage.removeItem('holzen_dev_mode');
  } catch {
    /* ignore */
  }
  return dbValue;
}

export function getAdminDevModeSettingQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? adminDevModeSettingQueryKey(userId) : ADMIN_DEV_MODE_SETTING_NONE_QUERY_KEY,
    queryFn: () => fetchDevModeFromAnalytics(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
