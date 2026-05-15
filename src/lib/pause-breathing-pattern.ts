/** Brief ritual: inhale → hold → exhale, four rounds (Figma / product; not box breath). */
export const BRIEF_RITUAL_BREATH_CYCLES = 4;

export const BRIEF_RITUAL_BREATH_PHASES = [
  { labelKey: 'breathing.phases.inhale', duration: 4 },
  { labelKey: 'breathing.phases.hold', duration: 4 },
  { labelKey: 'breathing.phases.exhale', duration: 4 },
] as const;

export const BRIEF_RITUAL_PHASE_COUNT = BRIEF_RITUAL_BREATH_PHASES.length;

/** Deep first segment / brief-adjacent box: four phases per round. */
export const BOX_BREATH_PHASE_COUNT = 4;

export function resolveBreathCycleTotal(
  ritualVariant: 'brief' | 'deep' | undefined,
  breathSegment: 'first' | 'second',
): number {
  if (ritualVariant === 'brief') return BRIEF_RITUAL_BREATH_CYCLES;
  return breathSegment === 'second' ? 2 : 3;
}
