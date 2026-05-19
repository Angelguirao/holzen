import { describe, expect, it, vi } from 'vitest';
import { persistCompanionUiStepCompletion } from './persist-ui-step-completion';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

function mockRepository(overrides: Partial<PauseRepository>): PauseRepository {
  return {
    createOrReuse: vi.fn(),
    adoptPendingOffer: vi.fn(),
    declinePendingOffer: vi.fn(),
    logStep: vi.fn().mockResolvedValue(null),
    logCompanion: vi.fn().mockResolvedValue({
      counts_for_pause: true,
      non_counting_reason: null,
      resulting_state: null,
    }),
    dismissCurrent: vi.fn(),
    ...overrides,
  };
}

describe('persistCompanionUiStepCompletion', () => {
  it('logs breath_completed for breathing chip', async () => {
    const logStep = vi.fn().mockResolvedValue('engaged');
    const repo = mockRepository({ logStep });
    await persistCompanionUiStepCompletion(repo, 'inst-1', 'breathing');
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'breath_completed',
    });
  });

  it('logs companion complete for haiku chip', async () => {
    const logCompanion = vi.fn().mockResolvedValue({
      counts_for_pause: true,
      non_counting_reason: null,
      resulting_state: null,
    });
    const repo = mockRepository({ logCompanion });
    await persistCompanionUiStepCompletion(repo, 'inst-1', 'haiku', { entryPoint: 'reflect' });
    expect(logCompanion).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      companionType: 'haiku',
      action: 'complete',
      entryPoint: 'reflect',
    });
  });
});
