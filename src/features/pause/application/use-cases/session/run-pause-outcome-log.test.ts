import { describe, expect, it, vi } from 'vitest';
import { runPauseOutcomeLog } from './run-pause-outcome-log';

describe('runPauseOutcomeLog', () => {
  it('returns no_instance without RPC', async () => {
    const logOutcome = vi.fn();
    expect(
      await runPauseOutcomeLog({ pauseInstanceId: null, decision: 'hold' }, { logOutcome }),
    ).toEqual({ status: 'no_instance' });
    expect(logOutcome).not.toHaveBeenCalled();
  });

  it('returns completed when RPC yields completed', async () => {
    const logOutcome = vi.fn().mockResolvedValue('completed');

    const result = await runPauseOutcomeLog(
      { pauseInstanceId: 'inst-1', decision: 'hold' },
      { logOutcome },
    );

    expect(result).toEqual({ status: 'completed' });
    expect(logOutcome).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { outcome: 'hold' },
    });
  });

  it('returns not_completed for other pause states', async () => {
    const logOutcome = vi.fn().mockResolvedValue('pending');

    const result = await runPauseOutcomeLog(
      { pauseInstanceId: 'inst-1', decision: 'sold' },
      { logOutcome },
    );

    expect(result).toEqual({ status: 'not_completed', outcomeState: 'pending' });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logOutcome = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runPauseOutcomeLog(
      { pauseInstanceId: 'inst-1', decision: 'hold' },
      { logOutcome },
    );

    expect(result).toEqual({ status: 'sync_failed' });
  });
});
