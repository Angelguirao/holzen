import type { PersistedSession } from '@/features/pause/domain/session-model';
import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

export { mapPersistedStep };

/**
 * Pause route helpers: map persisted step strings and derive session-level UI from `PersistedSession`.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Brief ritual restore:** `application/use-cases/ritual/reflect/scaffold/restored-brief-ritual-state.ts`.
 * **Breath ritual restore:** `application/use-cases/ritual/breathe/restored-breath-ritual-state.ts`.
 * **Depth picker entry:** `application/use-cases/ritual/reflect/scaffold/initial-ritual-entry.ts`.
 * **Ritual sync caveat:** `computePauseStorageRitualSyncPatch` in `application/use-cases/ritual/reflect/scaffold/storage-ritual-sync.ts`.
 * **Code map:** same pause doc, section 10 (Related docs and code).
 */

/** Session vs Done screen when hydrating `/pause` from local storage. */
export function initialPhaseFromRestored(restored: PersistedSession | null): 'session' | 'done' {
  return restored?.phase ?? 'session';
}

/** Outcome label persisted when the user finished Decide (or null). */
export function initialDecisionFromRestored(restored: PersistedSession | null): string | null {
  return restored?.decision ?? null;
}

/** Frame hub completion from local restore (matches `normalizePauseRitualFields`). */
export function initialFrameDoneFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.frameDone ?? false;
}
