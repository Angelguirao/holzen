/** Standalone overlay breathing (`BreathingExercise`) — not the shipped ritual triangle step. */

export type StandaloneBreathingPhase = { labelKey: string; duration: number };

export type StandaloneBreathingPattern = {
  nameKey: string;
  descKey: string;
  phases: readonly StandaloneBreathingPhase[];
};

export const STANDALONE_BREATHING_PATTERNS: readonly StandaloneBreathingPattern[] = [
  {
    nameKey: 'breathing.patterns.box',
    descKey: 'breathing.patterns.boxDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
      { labelKey: 'breathing.phases.exhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
    ],
  },
  {
    nameKey: 'breathing.patterns.calming',
    descKey: 'breathing.patterns.calmingDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 7 },
      { labelKey: 'breathing.phases.exhale', duration: 8 },
    ],
  },
  {
    nameKey: 'breathing.patterns.sigh',
    descKey: 'breathing.patterns.sighDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 3 },
      { labelKey: 'breathing.phases.sip', duration: 1 },
      { labelKey: 'breathing.phases.exhale', duration: 6 },
    ],
  },
] as const;

export const STANDALONE_BREATHING_CYCLE_COUNT = 3;

export type BreathingExerciseSeverity = 'mild' | 'moderate' | 'high';

/** Default pattern index when opening the standalone overlay. */
export function resolveSuggestedStandaloneBreathingPatternIndex(
  severity: BreathingExerciseSeverity,
): number {
  if (severity === 'high') return 1;
  return 0;
}

export type StandaloneBreathSeverityRingColors = {
  ringColor: string;
  ringBorder: string;
};

export function resolveStandaloneBreathSeverityRingColors(
  severity: BreathingExerciseSeverity,
): StandaloneBreathSeverityRingColors {
  if (severity === 'high') {
    return {
      ringColor: 'hsl(var(--destructive) / 0.2)',
      ringBorder: 'hsl(var(--destructive) / 0.4)',
    };
  }
  if (severity === 'moderate') {
    return {
      ringColor: 'hsl(var(--primary) / 0.2)',
      ringBorder: 'hsl(var(--primary) / 0.4)',
    };
  }
  return {
    ringColor: 'hsl(var(--muted-foreground) / 0.15)',
    ringBorder: 'hsl(var(--muted-foreground) / 0.25)',
  };
}
