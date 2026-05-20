import type { BriefPauseStep, FeelStepTile, RitualDepth } from '@/features/pause/domain/ritual-types';

export const BRIEF_DEPTH_PICKER_RITUAL_ENTRY = {
  ritualEntry: 'brief' as const,
  briefStep: 'feel' as const satisfies BriefPauseStep,
};

export const DEEP_DEPTH_PICKER_RITUAL_ENTRY = {
  ritualEntry: 'deep' as const,
};

export function isBriefRitualEntry(ritualEntry: RitualDepth | 'picker'): ritualEntry is 'brief' {
  return ritualEntry === 'brief';
}

/** Options for `initial_emotion_logged` when the Feel tiles row fires. */
export function buildFeelTilesMoodLogOptions(
  isBriefRitual: boolean,
  tile: FeelStepTile,
): { briefRitual?: boolean; briefFace: FeelStepTile } {
  return isBriefRitual ? { briefRitual: true, briefFace: tile } : { briefFace: tile };
}

/** Pro gate for depth picker → deep ritual; returns whether deep entry ran. */
export function runDeepPausePickerEntryIfPro(
  requirePro: (feature: 'deep_pause') => boolean,
  onDeep: () => void,
): boolean {
  if (!requirePro('deep_pause')) return false;
  onDeep();
  return true;
}
