import type { FeelStepTile } from '@/components/pause/pause-feel-types';

/**
 * Ritual breathing (`PauseBreathing`) pattern selection.
 *
 * - **`triangle`** — inhale → hold → exhale (no post-exhale hold), shipped today for brief + deep.
 * - **`feel_tile_mapped`** — reserved for design: route by Feel tile (e.g. FOMO → sigh, anxious → 4-6-8, calm → shorter box).
 *
 * Flip `PAUSE_RITUAL_BREATHING_PATTERN_MODE` when design + QA are ready; then implement branches in
 * `resolvePauseBreathingPhases` (and extend i18n under `breathing.phaseHints.*`).
 */
export type PauseRitualBreathingPatternMode = 'triangle' | 'feel_tile_mapped';

/** Product default until Feel-tile routing ships. */
export const PAUSE_RITUAL_BREATHING_PATTERN_MODE: PauseRitualBreathingPatternMode = 'triangle';

/** Inhale → hold → exhale per round (triangle / “partial box”). */
export const TRIANGLE_BREATH_PHASES = [
  { labelKey: 'breathing.phases.inhale', duration: 4 },
  { labelKey: 'breathing.phases.hold', duration: 4 },
  { labelKey: 'breathing.phases.exhale', duration: 4 },
] as const;

export const TRIANGLE_PHASE_COUNT = TRIANGLE_BREATH_PHASES.length;

/** Rounds on the brief Breathe step (~2 min ritual). */
export const BRIEF_TRIANGLE_CYCLE_COUNT = 4;

/** Deep pause: first Breathe segment after Feel. */
export const DEEP_TRIANGLE_FIRST_CYCLE_COUNT = 3;

/** Deep pause: second Breathe segment after Frame. */
export const DEEP_TRIANGLE_SECOND_CYCLE_COUNT = 2;

/** Legacy box pattern phase count (4-4-4-4); kept for tests and `BreathingExercise` tooling. */
export const BOX_BREATH_PHASE_COUNT = 4;

export function resolveBreathCycleTotal(
  ritualVariant: 'brief' | 'deep' | undefined,
  breathSegment: 'first' | 'second',
): number {
  if (ritualVariant === 'brief') return BRIEF_TRIANGLE_CYCLE_COUNT;
  return breathSegment === 'second' ? DEEP_TRIANGLE_SECOND_CYCLE_COUNT : DEEP_TRIANGLE_FIRST_CYCLE_COUNT;
}

export type ResolvePauseBreathingPhasesInput = {
  /** Override product default (e.g. feature flag). */
  mode?: PauseRitualBreathingPatternMode;
  ritualVariant: 'brief' | 'deep';
  /** Future `feel_tile_mapped`: tile chosen on Feel (brief + deep share the same grid). */
  feelTile?: FeelStepTile | null;
  /** Future `feel_tile_mapped`: optional secondary tuning. */
  severity?: 'mild' | 'moderate' | 'high';
};

/**
 * Phases for the in-ritual `PauseBreathing` component. Today always triangle; extend when
 * `PAUSE_RITUAL_BREATHING_PATTERN_MODE === 'feel_tile_mapped'`.
 */
export function resolvePauseBreathingPhases(
  input: ResolvePauseBreathingPhasesInput,
): ReadonlyArray<{ labelKey: string; duration: number }> {
  const mode = input.mode ?? PAUSE_RITUAL_BREATHING_PATTERN_MODE;

  if (mode === 'feel_tile_mapped') {
    // Future (design): e.g. `switch (input.feelTile) { case 'fomo': return SIGH_PHASES; ... }`
    // Keep severity available for hybrid rules without unused-param lint noise.
    void input.feelTile;
    void input.severity;
    void input.ritualVariant;
  }

  return [...TRIANGLE_BREATH_PHASES];
}
