import { logPauseDevModeSetting } from '@/features/pause/public-rpc';

export type { LogDevModeSettingInput } from '@/features/pause/application/use-cases/admin/run-log-dev-mode-setting';

/** Persists admin dev-mode toggle via `PauseAnalyticsRepository`. */
export async function logDevModeSetting(userId: string, enabled: boolean): Promise<void> {
  await logPauseDevModeSetting({ userId, enabled });
}
