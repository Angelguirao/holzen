import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { BriefPauseStep } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';

/**
 * Brief ritual fields when hydrating `/pause` from local storage.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Ritual sync caveat:** `computePauseStorageRitualSyncPatch` in `storage-ritual-sync.ts`
 * may intentionally omit `briefStep` when syncing — see `initialBriefPauseStepFromRestored` note below.
 */

/**
 * Initial brief sub-step when hydrating `/pause` from local storage.
 * When `ritualDepth` is not `brief`, callers still mount at `'feel'` until the user picks depth.
 *
 * Note: `computePauseStorageRitualSyncPatch` may leave `briefStep` undefined for a brief row
 * missing `briefStep` so React state is not clobbered — that is intentionally different.
 */
export function initialBriefPauseStepFromRestored(restored: PersistedSession | null): BriefPauseStep {
  if (restored?.ritualDepth === 'brief' && restored.briefStep) return restored.briefStep;
  return 'feel';
}

/** Hydrate brief “integrate” completion from local storage (defaults false). */
export function initialBriefIntegrateDoneFromRestored(restored: PersistedSession | null): boolean {
  return restored?.briefIntegrateDone ?? false;
}

/** Hydrate Feel-step tile from local storage (`PersistedSession.briefFace`, brief ritual saves only). */
export function initialSelectedBriefFaceFromRestored(restored: PersistedSession | null): FeelStepTile | null {
  return restored?.briefFace ?? null;
}
