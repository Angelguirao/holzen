import { runLogDevModeSetting } from '@/features/pause/application/use-cases/admin/run-log-dev-mode-setting';
import { supabasePauseAnalyticsRepository } from '@/features/pause/infrastructure/supabase-pause-analytics-repository';

export type { LogDevModeSettingInput } from '@/features/pause/application/use-cases/admin/run-log-dev-mode-setting';

/** Persists admin dev-mode toggle via `PauseAnalyticsRepository`. */
export async function logDevModeSetting(userId: string, enabled: boolean): Promise<void> {
  await runLogDevModeSetting(supabasePauseAnalyticsRepository, { userId, enabled });
}
