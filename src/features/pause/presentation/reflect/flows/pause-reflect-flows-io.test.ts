import { describe, expect, it, vi } from 'vitest';

const runPauseOutcomeLogMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log')
    >();
    return {
      ...actual,
      runPauseOutcomeLog: runPauseOutcomeLogMock,
    };
  },
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import { runPauseOutcomeLog as runPauseOutcomeLogDirect } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseImpactData,
} from './pause-reflect-flows-io';

describe('pause-reflect-flows-io', () => {
  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('types PauseImpactData via pause-session-decide-io (session decide beat)', () => {
    const sample: PauseImpactData = {
      mood: null,
      moodAfter: null,
      breathingCompleted: true,
      decision: 'hold',
      context: null,
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
    };
    expect(sample.decision).toBe('hold');
  });

  it('re-exports reflect-and-decide preflight helpers from subcluster flows', () => {
    const view = resolvePauseSessionReflectAndDecidePreflight({
      seedMessage: 'seed',
      ritualEntry: 'deep',
      step: 'reflect',
      btcData: null,
    });
    expect(view.reflectGenEnabled).toBe(true);
    expect(view.effectiveReflectionMessage).toBe('seed');
  });

  it('re-exports score-impact builders from ritual/decide score-impacts leaf modules', () => {
    const impacts = buildPauseScoreImpacts(
      {
        mood: 'calm',
        moodAfter: 'calm',
        breathingCompleted: true,
        decision: 'hold',
        context: null,
        engagedTools: 0,
        wroteNote: false,
        usedTags: false,
      },
      (key) => key,
      'brief',
    );
    expect(impacts.length).toBeGreaterThan(0);
  });

  it('re-exports decide flow helpers from domain/decide leaf modules', () => {
    const quote = getSessionQuote();
    expect(formatReinforcementQuoteFromSession(quote)).toContain(quote.author);
    expect(
      resolvePauseDecideOutcomeFlow({
        outcome: { status: 'sync_failed' },
        decision: 'hold',
        ritualSnapshot: {
          context: null,
          selectedMood: null,
          selectedMoodAfter: null,
          ritualEntry: 'deep',
          breathingFirstCompleted: true,
          breathingSecondCompleted: true,
          feelIntensity: null,
          shiftIntensity: null,
          reflectionMessage: '',
          haiku: null,
        },
        reinforcementQuote: 'quote',
      }).kind,
    ).toBe('abort_sync_failed');
  });

  it('exports pauseReflectOutcomeLog wrappers distinct from run-pause-outcome-log leaf', () => {
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLogDirect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLogDirect);
  });

  it('routes decide outcome log through the default PauseRepository port adapter', async () => {
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'completed' });

    const result = await pauseReflectOutcomeLog({
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });

    expect(result).toEqual({ status: 'completed' });
    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });
  });

  it('pauseReflectOutcomeLogWithRepository forwards a custom repository', async () => {
    const repository = { port: 'custom' } as import('@/features/pause/ports/pause-repository').PauseRepository;
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'no_instance' });

    await pauseReflectOutcomeLogWithRepository(repository, {
      pauseInstanceId: null,
      decision: 'hold',
    });

    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(repository, {
      pauseInstanceId: null,
      decision: 'hold',
    });
  });
});
