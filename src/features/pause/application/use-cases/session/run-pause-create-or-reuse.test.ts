import { describe, expect, it, vi } from 'vitest';
import { runPauseCreateOrReuse } from './run-pause-create-or-reuse';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('runPauseCreateOrReuse', () => {
  it('delegates to repository.createOrReuse', async () => {
    const result = {
      instance_id: 'inst-1',
      created: true,
      reused_reason: null,
      pending_offer: false,
      prior_open_instance_id: null,
    };
    const createOrReuse = vi.fn().mockResolvedValue(result);
    const repo = { createOrReuse } as unknown as PauseRepository;
    const params = {
      templateSlug: 'volatility_v1',
      source: 'home_manual',
      contextSnapshot: {},
      contextRuleResult: {},
      contextFingerprint: 'fp-1',
    };
    await expect(runPauseCreateOrReuse(repo, params)).resolves.toEqual(result);
    expect(createOrReuse).toHaveBeenCalledWith(params);
  });
});
