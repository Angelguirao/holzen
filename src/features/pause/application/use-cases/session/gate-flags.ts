import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';
import type { PauseSessionHydrationState } from '@/features/pause/application/use-cases/session/hydration';

export { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';

/**
 * Pure predicates for `/pause` gate UI: spinner while fetching instance by id. Depth-picker gate
 * lives in `domain/reflect/mood/pause-depth-picker-active.ts` (reflect beat).
 *
 * **Wiring:** `src/screens/pause/PauseSessionScreen.tsx` → `PauseSessionGate` / `PauseSessionGateContent`.
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
