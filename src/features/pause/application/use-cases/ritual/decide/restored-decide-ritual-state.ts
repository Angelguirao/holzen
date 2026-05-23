import type { PersistedSession } from '@/features/pause/domain/session-model';

/**
 * Decide / Done ritual fields when hydrating `/pause` from local storage.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 */

/** Session vs Done screen when hydrating `/pause` from local storage. */
export function initialPhaseFromRestored(restored: PersistedSession | null): 'session' | 'done' {
  return restored?.phase ?? 'session';
}

/** Outcome label persisted when the user finished Decide (or null). */
export function initialDecisionFromRestored(restored: PersistedSession | null): string | null {
  return restored?.decision ?? null;
}
