import { describe, expect, it, vi } from 'vitest';
import { runLogPwaInstallAnalyticsEvent } from './run-log-pwa-install-analytics-event';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

describe('runLogPwaInstallAnalyticsEvent', () => {
  it('delegates to repository.insertEvent', async () => {
    const insertEvent = vi.fn().mockResolvedValue({ ok: true });
    const repository = { insertEvent } as unknown as PauseAnalyticsRepository;
    await expect(
      runLogPwaInstallAnalyticsEvent(repository, {
        userId: 'user-1',
        event: 'pwa_install_prompt_shown',
        metadata: { surface: 'home' },
      }),
    ).resolves.toEqual({ ok: true });
    expect(insertEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'pwa_install_prompt_shown',
      metadata: { surface: 'home' },
    });
  });
});
