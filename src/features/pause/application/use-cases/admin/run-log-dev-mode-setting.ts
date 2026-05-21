import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

export type LogDevModeSettingInput = {
  userId: string;
  enabled: boolean;
};

/** Persist admin rapid-testing toggle for cross-device dev-mode hydration. */
export async function runLogDevModeSetting(
  repository: PauseAnalyticsRepository,
  input: LogDevModeSettingInput,
): Promise<{ ok: boolean }> {
  return repository.insertEvent({
    userId: input.userId,
    event: 'dev_mode_setting',
    metadata: { enabled: input.enabled },
  });
}
