import {
  rotatingKickerIndexFromElapsed,
  secondsIntoTrianglePattern,
} from '@/features/pause/application/use-cases/breathing/ritual-pattern';

export type ResolveTriangleKickerDisplayInput = {
  kickers: readonly string[];
  cycle: number;
  phaseIndex: number;
  elapsedInCurrentPhase: number;
  phaseDurationsSec: readonly number[];
};

export type TriangleKickerDisplay = {
  line: string;
  index: number;
  hasKickers: boolean;
};

/** Maps timed-loop position to the rotating triangle kicker line (2s cadence). */
export function resolveTriangleKickerDisplay(input: ResolveTriangleKickerDisplayInput): TriangleKickerDisplay {
  const { kickers, cycle, phaseIndex, elapsedInCurrentPhase, phaseDurationsSec } = input;
  const hasKickers = kickers.length > 0;
  if (!hasKickers) {
    return { line: '', index: 0, hasKickers: false };
  }

  const secondsIntoPattern = secondsIntoTrianglePattern({
    cycle,
    phaseIndex,
    elapsedInCurrentPhase,
    phaseDurationsSec,
  });
  const index = rotatingKickerIndexFromElapsed(secondsIntoPattern, kickers.length);
  const line = kickers[index] ?? '';

  return { line, index, hasKickers: true };
}
