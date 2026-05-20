import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseOutcomeLog } from './run-pause-outcome-log';

describe('runPauseOutcomeLog', () => {
  it('returns no_instance without RPC', async () => {
    const repository = { logStep: vi.fn() } as unknown as PauseRepository;
    expect(
      await runPauseOutcomeLog(repository, { pauseInstanceId: null, decision: 'hold' }),
    ).toEqual({ status: 'no_instance' });
    expect(repository.logStep).not.toHaveBeenCalled();
  });

  it('returns completed when RPC yields completed', async () => {
    const logStep = vi.fn().mockResolvedValue('completed');
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseOutcomeLog(
      repository,
      { pauseInstanceId: 'inst-1', decision: 'hold' },
    );

    expect(result).toEqual({ status: 'completed' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'outcome_logged',
      payload: { outcome: 'hold' },
    });
  });

  it('returns not_completed for other pause states', async () => {
    const logStep = vi.fn().mockResolvedValue('pending');
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseOutcomeLog(
      repository,
      { pauseInstanceId: 'inst-1', decision: 'sold' },
    );

    expect(result).toEqual({ status: 'not_completed', outcomeState: 'pending' });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseOutcomeLog(
      repository,
      { pauseInstanceId: 'inst-1', decision: 'hold' },
    );

    expect(result).toEqual({ status: 'sync_failed' });
  });
});
