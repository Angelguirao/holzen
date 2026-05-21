import { runFetchDevModeSetting } from '@/features/pause/application/use-cases/admin/run-fetch-dev-mode-setting';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-ports';

/** Matches `screens/admin/lib/admin-query-namespace` — keep in sync if the prefix changes. */
const ADMIN_QUERY_PREFIX = ['admin'] as const;

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

/** Admin: hydrate rapid-testing toggle from latest analytics_events row. */
export async function fetchDevModeFromAnalytics(userId: string): Promise<boolean> {
  const dbValue = await runFetchDevModeSetting(supabasePauseAnalyticsRepository, userId);
  if (dbValue === null) {
    return readLocalDevMode();
  }
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
