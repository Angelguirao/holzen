import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { runPauseCreateOrReuse } from '@/features/pause/application/use-cases/session/run-pause-create-or-reuse';
import { openManualPauseFromHome } from './open-manual-pause-from-home';

vi.mock('@/features/pause/application/use-cases/session/run-pause-create-or-reuse', () => ({
  runPauseCreateOrReuse: vi.fn(),
}));

const runPauseCreateOrReuseMock = vi.mocked(runPauseCreateOrReuse);

function mockPorts(): { repository: PauseRepository; reflect: ReflectGenerator } {
  return {
    repository: { createOrReuse: vi.fn() } as unknown as PauseRepository,
    reflect: { persistReflectionArtifacts: vi.fn() } as unknown as ReflectGenerator,
  };
}

const baseParams = {
  userId: 'u1',
  contextText: 'ctx',
  changePercent: 3,
  trackedAssetId: 'bitcoin',
  severityBand: 'mild',
  fearGreedLabel: null,
  onChainBand: null,
  fearGreed: null,
  onChain: null,
} as const;

describe('openManualPauseFromHome', () => {
  beforeEach(() => {
    runPauseCreateOrReuseMock.mockReset();
  });

  it('routes create through runPauseCreateOrReuse on the repository port', async () => {
    const repository = { createOrReuse: vi.fn() } as unknown as PauseRepository;
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: 'pause-3',
      created: true,
      reused_reason: null,
      pending_offer: false,
      prior_open_instance_id: null,
    });

    await openManualPauseFromHome(
      {
        repository,
        reflect: { persistReflectionArtifacts: vi.fn() } as unknown as ReflectGenerator,
      },
      { ...baseParams, changePercent: 3 },
    );

    expect(runPauseCreateOrReuseMock).toHaveBeenCalledOnce();
    expect(runPauseCreateOrReuseMock).toHaveBeenCalledWith(
      repository,
      expect.objectContaining({
        templateSlug: 'volatility_v1',
        source: 'manual',
        contextSnapshot: expect.objectContaining({ context_text: 'ctx' }),
      }),
    );
    expect(repository.createOrReuse).not.toHaveBeenCalled();
  });

  it('returns idle when RPC yields no instance', async () => {
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: null,
      created: false,
      reused_reason: 'fingerprint_match',
      pending_offer: false,
      prior_open_instance_id: null,
    });
    const result = await openManualPauseFromHome(mockPorts(), {
      ...baseParams,
      changePercent: -5,
      severityBand: 'moderate',
    });
    expect(result.outcome).toBe('idle');
  });

  it('returns opened when instance is created', async () => {
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: 'pause-2',
      created: true,
      reused_reason: null,
      pending_offer: true,
      prior_open_instance_id: null,
    });
    const result = await openManualPauseFromHome(mockPorts(), {
      ...baseParams,
      changePercent: 2,
    });
    expect(result).toMatchObject({
      outcome: 'opened',
      pendingOffer: true,
      silentStubPersisted: false,
    });
  });
});
