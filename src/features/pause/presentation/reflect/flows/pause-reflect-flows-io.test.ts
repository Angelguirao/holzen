import { describe, expect, it, vi } from 'vitest';

const runPauseOutcomeLogMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow', () => ({
  runPauseOutcomeLog: runPauseOutcomeLogMock,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-reflect-flows-io';

describe('pause-reflect-flows-io', () => {
  it('re-exports reflect-and-decide preflight helpers for presentation conductors', () => {
    const view = resolvePauseSessionReflectAndDecidePreflight({
      seedMessage: 'seed',
      ritualEntry: 'deep',
      step: 'reflect',
      btcData: null,
    });
    expect(view.reflectGenEnabled).toBe(true);
    expect(view.effectiveReflectionMessage).toBe('seed');
  });

  it('re-exports decide flow helpers for presentation conductors', () => {
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

  it('routes decide outcome log through the default PauseRepository port adapter', async () => {
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'completed' });

    const result = await pauseReflectOutcomeLog({
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });

    expect(result).toEqual({ status: 'completed' });
    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(
      { port: 'reflectPauseRepository' },
      { pauseInstanceId: 'pi-1', decision: 'hold' },
    );
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
