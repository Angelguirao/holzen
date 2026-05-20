import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';

/**
 * Ritual breathing (`PauseBreathing`) pattern selection.
 *
 * - **`triangle`** — inhale → hold → exhale (no post-exhale hold), shipped today for brief + deep.
 * - **`feel_tile_mapped`** — reserved for design: route by Feel tile (e.g. FOMO → sigh, anxious → 4-6-8, calm → shorter box).
 *
 * Flip `PAUSE_RITUAL_BREATHING_PATTERN_MODE` when design + QA are ready; then implement branches in
 * `resolvePauseBreathingPhases` (and extend i18n, e.g. `breathing.triangleRotatingKickers` or feel-tile-specific lists).
 */
export type PauseRitualBreathingPatternMode = 'triangle' | 'feel_tile_mapped';

/** Product default until Feel-tile routing ships. */
export const PAUSE_RITUAL_BREATHING_PATTERN_MODE: PauseRitualBreathingPatternMode = 'triangle';

/** Figma: kicker line under the phase timer advances every N seconds, not on phase boundaries. */
export const RITUAL_TRIANGLE_KICKER_INTERVAL_SEC = 2;

export function secondsIntoTrianglePattern(input: {
  cycle: number;
  phaseIndex: number;
  elapsedInCurrentPhase: number;
  phaseDurationsSec: readonly number[];
}): number {
  const { cycle, phaseIndex, elapsedInCurrentPhase, phaseDurationsSec } = input;
  const roundLen = phaseDurationsSec.reduce((a, b) => a + b, 0);
  let before = 0;
  for (let i = 0; i < phaseIndex; i++) {
    before += phaseDurationsSec[i] ?? 0;
  }
  return cycle * roundLen + before + elapsedInCurrentPhase;
}

/**
 * Progress through the **current** hold segment (0 → 1), for layered hold visuals (mandala / mark).
 * Resets each time the user enters a new hold. Uses whole-second `elapsedSec` from the breathing tick.
 *
 * Maps the last displayed second to 1 so the composition can resolve before phase advance.
 */
export function holdProgressWithinPhase(elapsedSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  if (durationSec === 1) return 1;
  return Math.min(1, Math.max(0, elapsedSec / (durationSec - 1)));
}

/** Parses `breathing.triangleRotatingKickers` i18n `returnObjects` payload. */
export function parseTriangleRotatingKickersI18n(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

/** Which kicker string to show (0-based), holding the last line for any tail time. */
export function rotatingKickerIndexFromElapsed(
  secondsIntoPattern: number,
  kickerCount: number,
  intervalSec: number = RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
): number {
  if (kickerCount <= 0) return 0;
  return Math.min(Math.floor(secondsIntoPattern / intervalSec), kickerCount - 1);
}

/** Inhale → hold → exhale per round (triangle / “partial box”). */
export const TRIANGLE_BREATH_PHASES = [
  { labelKey: 'breathing.phases.inhale', duration: 4 },
  { labelKey: 'breathing.phases.hold', duration: 4 },
  { labelKey: 'breathing.phases.exhale', duration: 4 },
] as const;

export const TRIANGLE_PHASE_COUNT = TRIANGLE_BREATH_PHASES.length;

/** Rounds on the brief Breathe step (~2 min ritual). */
export const BRIEF_TRIANGLE_CYCLE_COUNT = 3;

/** Deep pause: first Breathe segment after Feel. */
export const DEEP_TRIANGLE_FIRST_CYCLE_COUNT = 3;

/** Deep pause: second Breathe segment after Frame. */
export const DEEP_TRIANGLE_SECOND_CYCLE_COUNT = 2;

/** Legacy box pattern phase count (4-4-4-4); kept for tests and standalone overlay patterns. */
export { BOX_BREATH_PHASE_COUNT } from '../ritual/breathe/breathing-constants';

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
