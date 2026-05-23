import type { PersistedSession } from '@/features/pause/domain/session-model';

/**
 * Frame ritual fields when hydrating `/pause` from local storage.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Normalization:** matches `normalizePauseRitualFields` in `pause-session-storage.ts`.
 */

/** Frame hub completion from local restore (matches `normalizePauseRitualFields`). */
export function initialFrameDoneFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.frameDone ?? false;
}
