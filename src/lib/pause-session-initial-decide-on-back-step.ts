import type { PersistedSession } from '@/lib/pause-session-storage';

type DecideOnBackStep = NonNullable<PersistedSession['decideOnBackStep']>;

/**
 * Initial Decide screen back target when hydrating from local persisted session.
 * Prefer explicit `decideOnBackStep`; else infer from being restored on Decide (skip-second-breath path).
 */
export function initialDecideOnBackStepFromPersisted(
  restored: Pick<PersistedSession, 'decideOnBackStep' | 'step'> | null,
): DecideOnBackStep {
  if (!restored) return 'choose';
  if (restored.decideOnBackStep) return restored.decideOnBackStep;
  if (restored.step === 'decide') return 'breath2';
  return 'choose';
}
