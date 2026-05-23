import type { RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { hasPersistedPauseSessionPayload } from '@/features/pause/domain/session/persisted-session-guards';

/**
 * Initial depth-picker vs brief/deep from restored local session.
 * Call with `null` when there is no compatible restore payload.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 */
export function initialRitualEntry(restored: PersistedSession | null): RitualDepth | 'picker' {
  if (!hasPersistedPauseSessionPayload(restored)) return 'picker';
  if (restored.ritualDepth === 'brief' || restored.ritualDepth === 'deep') return restored.ritualDepth;
  if (restored.moodDone || restored.phase === 'done' || restored.step !== 'feel') return 'deep';
  return 'picker';
}
