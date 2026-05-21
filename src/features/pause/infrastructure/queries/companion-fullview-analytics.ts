import type { LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';
import { logPauseCompanionFullviewOpened } from '@/features/pause/public-rpc';

export type { CompanionFullviewKind, LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';

export async function logCompanionFullviewOpened(
  input: LogCompanionFullviewOpenedInput,
): Promise<{ ok: boolean }> {
  return logPauseCompanionFullviewOpened(input);
}
