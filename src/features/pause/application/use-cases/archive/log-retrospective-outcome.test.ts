import { describe, expect, it, vi } from 'vitest';
import { logRetrospectiveOutcome } from './log-retrospective-outcome';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('logRetrospectiveOutcome', () => {
  it('calls logStep with outcome_logged payload', async () => {
    const logStep = vi.fn().mockResolvedValue('expired');
    const repo = { logStep } as unknown as PauseRepository;
    await logRetrospectiveOutcome(repo, { instanceId: 'p1', outcome: 'held' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'p1',
      stepType: 'outcome_logged',
      payload: { outcome: 'held' },
    });
  });
});
