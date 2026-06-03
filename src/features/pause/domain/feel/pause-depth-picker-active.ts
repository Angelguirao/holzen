import type { RitualDepth } from '@/features/pause/domain/ritual-types';

export type PauseSessionPhase = 'session' | 'done';

/** Depth picker: session phase and user has not chosen brief/deep yet. */
export function isPauseSessionDepthPickerActive(input: {
  phase: PauseSessionPhase;
  ritualEntry: RitualDepth | 'picker';
  /** @deprecated No longer gates the picker; kept for call-site parity tests. */
  hasShellMessage?: boolean;
}): boolean {
  const { phase, ritualEntry } = input;
  return phase === 'session' && ritualEntry === 'picker';
}
