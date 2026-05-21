import type { PersistedSession } from '@/features/pause/domain/session-model';

/**
 * Breath ritual fields when hydrating `/pause` from local storage.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Legacy v1:** `breathingCompleted` rolls into `breathingFirstCompleted` (matches `normalizePauseRitualFields`).
 */

/**
 * First breath segment completion from local restore. Matches `normalizePauseRitualFields` in
 * `pause-session-storage.ts` (legacy v1 `breathingCompleted` rolls into `breathingFirstCompleted`).
 */
export function initialBreathingFirstCompletedFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.breathingFirstCompleted ?? restored.breathingCompleted ?? false;
}

/** Second breath segment completion from local restore (matches `normalizePauseRitualFields`). */
export function initialBreathingSecondCompletedFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.breathingSecondCompleted ?? false;
}
