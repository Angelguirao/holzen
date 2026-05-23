import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';

/**
 * Pure predicate for `/pause` gate UI: spinner while fetching instance by id.
 *
 * **Wiring:** `PauseSessionGate` / shell bootstrap via `public-session.ts`.
 * **Hydration model:** `docs/systems/pause-system.md` section 7.2.
 */
export function isPauseSessionWaitingForInstanceFetch(input: {
  hydrationStatus: 'fetch' | 'ready' | 'empty';
  fetchFailed: boolean;
  fetchedInstance: FetchedPauseInstance | null;
}): boolean {
  const { hydrationStatus, fetchFailed, fetchedInstance } = input;
  return hydrationStatus === 'fetch' && !fetchFailed && !fetchedInstance;
}
