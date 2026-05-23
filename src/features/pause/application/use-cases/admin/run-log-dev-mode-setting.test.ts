import { describe, expect, it, vi } from 'vitest';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import { runLogDevModeSetting } from './run-log-dev-mode-setting';

describe('runLogDevModeSetting', () => {
  it('delegates to repository.insertEvent', async () => {
    const insertEvent = vi.fn().mockResolvedValue({ ok: true });
    const repository = { insertEvent } as unknown as PauseAnalyticsRepository;

    await expect(
      runLogDevModeSetting(repository, { userId: 'user-1', enabled: true }),
    ).resolves.toEqual({ ok: true });

    expect(insertEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'dev_mode_setting',
      metadata: { enabled: true },
    });
  });
});
