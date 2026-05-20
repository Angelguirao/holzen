import type { LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';
import { runLogCompanionFullviewOpened } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import { supabasePauseAnalyticsRepository } from '@/features/pause/infrastructure/supabase-pause-analytics-repository';

export type { CompanionFullviewKind, LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';

export async function logCompanionFullviewOpened(
  input: LogCompanionFullviewOpenedInput,
): Promise<{ ok: boolean }> {
  return runLogCompanionFullviewOpened(supabasePauseAnalyticsRepository, input);
}
