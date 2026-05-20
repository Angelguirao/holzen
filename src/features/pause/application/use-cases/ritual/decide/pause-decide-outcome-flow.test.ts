import { describe, expect, it } from 'vitest';
import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from './pause-decide-outcome-flow';
import type { BuildPauseImpactDataOnCompleteInput } from '@/features/pause/application/use-cases/ritual/decide/impact-data';

const ritualSnapshot: Omit<BuildPauseImpactDataOnCompleteInput, 'decision' | 'reinforcementQuote'> = {
  context: 'BTC',
  selectedMood: 'calm',
  selectedMoodAfter: 'calm',
  ritualEntry: 'deep',
  breathingFirstCompleted: true,
  breathingSecondCompleted: true,
  feelIntensity: 3,
  shiftIntensity: 2,
  reflectionMessage: 'Stay steady',
  haiku: null,
};

describe('pause-decide-outcome-flow', () => {
  it('formats reinforcement quote for impact shell', () => {
    expect(formatReinforcementQuoteFromSession({ text: 'Wait', author: 'Buffett' })).toBe(
      '"Wait" — Buffett',
    );
  });

  it('aborts on sync failure or not completed', () => {
    expect(
      resolvePauseDecideOutcomeFlow({
        outcome: { status: 'sync_failed' },
        decision: 'hold',
        ritualSnapshot,
        reinforcementQuote: '"Q" — A',
      }),
    ).toEqual({ kind: 'abort_sync_failed' });

    expect(
      resolvePauseDecideOutcomeFlow({
        outcome: { status: 'not_completed', outcomeState: 'pending' },
        decision: 'hold',
        ritualSnapshot,
        reinforcementQuote: '"Q" — A',
      }),
    ).toEqual({
      kind: 'abort_not_completed',
      invalidateStats: true,
      refreshSubscription: true,
    });
  });

  it('advances with impact data when completed or no instance', () => {
    const completed = resolvePauseDecideOutcomeFlow({
      outcome: { status: 'completed' },
      decision: 'hold',
      ritualSnapshot,
      reinforcementQuote: '"Q" — A',
    });
    expect(completed).toMatchObject({
      kind: 'advance',
      refreshSubscription: true,
      decision: 'hold',
      pauseImpactData: expect.objectContaining({ decision: 'hold', context: 'BTC' }),
    });

    const noInstance = resolvePauseDecideOutcomeFlow({
      outcome: { status: 'no_instance' },
      decision: 'hold',
      ritualSnapshot,
      reinforcementQuote: '"Q" — A',
    });
    expect(noInstance).toMatchObject({
      kind: 'advance',
      refreshSubscription: false,
      decision: 'hold',
    });
  });
});
