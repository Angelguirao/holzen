import { holdProgressWithinPhase } from './ritual-pattern';

/** Triangle inhale / sip phases — orb expands with elapsed progress. */
export const PAUSE_BREATH_EXPAND_PHASE_LABEL_KEYS = [
  'breathing.phases.inhale',
  'breathing.phases.sip',
] as const;

/** Triangle exhale — orb contracts with elapsed progress. */
export const PAUSE_BREATH_CONTRACT_PHASE_LABEL_KEYS = ['breathing.phases.exhale'] as const;

export const PAUSE_BREATH_HOLD_PHASE_LABEL_KEY = 'breathing.phases.hold';

export type ResolveBreathOrbVisualMetricsInput = {
  phaseLabelKey: string;
  elapsed: number;
  phaseDuration: number;
};

export type BreathOrbVisualMetrics = {
  orbScale: number;
  phaseProgress: number;
  showHoldMandala: boolean;
  holdProgress: number;
};

/** Maps timed-loop phase state to `BreathOrbVisual` props (no React). */
export function resolveBreathOrbVisualMetrics(
  input: ResolveBreathOrbVisualMetricsInput,
): BreathOrbVisualMetrics {
  const { phaseLabelKey, elapsed, phaseDuration } = input;
  const progress = phaseDuration > 0 ? elapsed / phaseDuration : 0;
  const isExpand = (PAUSE_BREATH_EXPAND_PHASE_LABEL_KEYS as readonly string[]).includes(phaseLabelKey);
  const isContract = (PAUSE_BREATH_CONTRACT_PHASE_LABEL_KEYS as readonly string[]).includes(phaseLabelKey);
  const orbScale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;
  const showHoldMandala = phaseLabelKey === PAUSE_BREATH_HOLD_PHASE_LABEL_KEY;
  const holdProgress = showHoldMandala ? holdProgressWithinPhase(elapsed, phaseDuration) : 0;

  return {
    orbScale,
    phaseProgress: progress,
    showHoldMandala,
    holdProgress,
  };
}
