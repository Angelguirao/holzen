import { describe, expect, it, vi } from 'vitest';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import { runFetchDevModeSetting } from './run-fetch-dev-mode-setting';

describe('runFetchDevModeSetting', () => {
  it('delegates to repository.fetchDevModeSetting', async () => {
    const fetchDevModeSetting = vi.fn().mockResolvedValue(true);
    const repository = { fetchDevModeSetting } as unknown as PauseAnalyticsRepository;

    await expect(runFetchDevModeSetting(repository, 'user-1')).resolves.toBe(true);
    expect(fetchDevModeSetting).toHaveBeenCalledWith('user-1');
  });
});
