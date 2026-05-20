import { resolveBreathOrbVisualMetrics } from '@/features/pause/application/use-cases/breathing/pause-breath-orb-metrics';
import { resolveTriangleKickerDisplay } from '@/features/pause/application/use-cases/breathing/resolve-triangle-kicker-display';

export type PauseBreathingPhase = { labelKey: string; duration: number };

export type PauseBreathingTimedDisplay = ReturnType<typeof resolveBreathOrbVisualMetrics> & {
  triangleKickerLine: string;
  triangleKickerIndex: number;
  hasTriangleKickers: boolean;
};

/** Orb metrics + rotating triangle kicker line for the active timed-loop phase. */
export function resolvePauseBreathingTimedDisplay(input: {
  phases: readonly PauseBreathingPhase[];
  currentPhase: PauseBreathingPhase;
  elapsed: number;
  cycle: number;
  phaseIndex: number;
  triangleRotatingKickers: readonly string[];
}): PauseBreathingTimedDisplay {
  const phaseDurationsSec = input.phases.map((p) => p.duration);
  const { line, index, hasKickers } = resolveTriangleKickerDisplay({
    kickers: input.triangleRotatingKickers,
    cycle: input.cycle,
    phaseIndex: input.phaseIndex,
    elapsedInCurrentPhase: input.elapsed,
    phaseDurationsSec,
  });
  const orb = resolveBreathOrbVisualMetrics({
    phaseLabelKey: input.currentPhase.labelKey,
    elapsed: input.elapsed,
    phaseDuration: input.currentPhase.duration,
  });

  return {
    ...orb,
    triangleKickerLine: line,
    triangleKickerIndex: index,
    hasTriangleKickers: hasKickers,
  };
}
