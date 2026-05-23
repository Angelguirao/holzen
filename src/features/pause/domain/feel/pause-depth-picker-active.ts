import type { RitualDepth } from '@/features/pause/domain/ritual-types';

export type PauseSessionPhase = 'session' | 'done';

/** Depth picker: session phase, user still on ritual picker, and coalesced shell has a message to anchor the ritual. */
export function isPauseSessionDepthPickerActive(input: {
  phase: PauseSessionPhase;
  ritualEntry: RitualDepth | 'picker';
  hasShellMessage: boolean;
}): boolean {
  const { phase, ritualEntry, hasShellMessage } = input;
  return phase === 'session' && ritualEntry === 'picker' && hasShellMessage;
}
