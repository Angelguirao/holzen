import type { FetchedPauseInstance, RitualDepth } from '@/lib/pause-session-storage';
import type { PauseSessionHydrationState } from '@/lib/pause-session-hydration';

/** True while `usePauseSessionShell` is in fetch hydration and the instance row has not arrived. */
export function isPauseSessionWaitingForInstanceFetch(input: {
  hydrationStatus: PauseSessionHydrationState['status'];
  fetchFailed: boolean;
  fetchedInstance: FetchedPauseInstance | null;
}): boolean {
  const { hydrationStatus, fetchFailed, fetchedInstance } = input;
  return hydrationStatus === 'fetch' && !fetchFailed && !fetchedInstance;
}

/** Depth picker: session phase, user still on ritual picker, and coalesced shell has a message to anchor the ritual. */
export function isPauseSessionDepthPickerActive(input: {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  hasShellMessage: boolean;
}): boolean {
  const { phase, ritualEntry, hasShellMessage } = input;
  return phase === 'session' && ritualEntry === 'picker' && hasShellMessage;
}
