import type { FetchedPauseInstance, RitualDepth } from '@/lib/pause-session-storage';
import type { PauseSessionHydrationState } from '@/features/pause/application/session/hydration';

/**
 * Pure predicates for `/pause` gate UI: spinner while fetching instance by id, vs depth picker when
 * the user has a shell message but has not chosen brief/deep yet.
 *
 * **Wiring:** `src/pages/PauseSession.tsx` → `PauseSessionGate` / `PauseSessionGateContent`.
 * **Hydration model:** `docs/systems/pause-system.md` section 7.2; **code map:** same doc, section 10.
 */

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
