import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';

/** Ritual state applied when the user picks Brief on the depth picker. */
export const BRIEF_DEPTH_PICKER_RITUAL_ENTRY = {
  ritualEntry: 'brief' as const satisfies RitualDepth,
  briefStep: 'feel' as const satisfies BriefPauseStep,
};

/** Ritual state applied when the user picks Deep on the depth picker. */
export const DEEP_DEPTH_PICKER_RITUAL_ENTRY = {
  ritualEntry: 'deep' as const satisfies RitualDepth,
};
