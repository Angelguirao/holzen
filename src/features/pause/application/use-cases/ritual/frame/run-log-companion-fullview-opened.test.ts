import { describe, expect, it, vi } from 'vitest';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import { runLogCompanionFullviewOpened } from './run-log-companion-fullview-opened';

describe('runLogCompanionFullviewOpened', () => {
  it('delegates to repository.insertEvent', async () => {
    const insertEvent = vi.fn().mockResolvedValue({ ok: true });
    const repository = { insertEvent } as unknown as PauseAnalyticsRepository;
    const input = {
      userId: 'user-1',
      companion: 'history' as const,
      pauseInstanceId: 'pause-2',
    };

    await expect(runLogCompanionFullviewOpened(repository, input)).resolves.toEqual({ ok: true });
    expect(insertEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'companion_fullview_opened',
      metadata: expect.objectContaining({
        companion: 'history',
        pause_instance_id: 'pause-2',
      }),
    });
  });
});
