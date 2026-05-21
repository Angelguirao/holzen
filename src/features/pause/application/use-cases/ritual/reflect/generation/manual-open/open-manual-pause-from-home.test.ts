import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { runPauseCreateOrReuse } from '@/features/pause/application/use-cases/session/run-pause-create-or-reuse';
import { runOpenManualPauseSilentModeAfterCreate } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create';
import { openManualPauseFromHome } from './open-manual-pause-from-home';

vi.mock('@/features/pause/application/use-cases/session/run-pause-create-or-reuse', () => ({
  runPauseCreateOrReuse: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create',
  () => ({
    runOpenManualPauseSilentModeAfterCreate: vi.fn(),
  }),
);

const runPauseCreateOrReuseMock = vi.mocked(runPauseCreateOrReuse);
const runOpenManualPauseSilentModeAfterCreateMock = vi.mocked(runOpenManualPauseSilentModeAfterCreate);

function mockPorts(): { repository: PauseRepository; reflect: ReflectGenerator } {
  return {
    repository: { createOrReuse: vi.fn() } as unknown as PauseRepository,
    reflect: { persistReflectionArtifacts: vi.fn() } as unknown as ReflectGenerator,
  };
}

describe('openManualPauseFromHome', () => {
  beforeEach(() => {
    runPauseCreateOrReuseMock.mockReset();
    runOpenManualPauseSilentModeAfterCreateMock.mockReset();
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
      {
        userId: 'u1',
        silentMode: false,
        contextText: 'ctx',
        silentMessage: 'BTC moved.',
        changePercent: 3,
        cumulativeChangePercent: 4,
        trackedAssetId: 'bitcoin',
        severityBand: 'mild',
        fearGreedLabel: null,
        onChainBand: null,
      },
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
      userId: 'u1',
      silentMode: false,
      contextText: 'ctx',
      silentMessage: 'BTC moved.',
      changePercent: -5,
      cumulativeChangePercent: -10,
      trackedAssetId: 'bitcoin',
      severityBand: 'moderate',
      fearGreedLabel: null,
      onChainBand: null,
    });
    expect(result.outcome).toBe('idle');
  });

  it('persists silent stub when silentMode is on', async () => {
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: 'pause-1',
      created: true,
      reused_reason: null,
      pending_offer: false,
      prior_open_instance_id: null,
    });
    runOpenManualPauseSilentModeAfterCreateMock.mockResolvedValue({
      outcome: 'opened',
      instanceId: 'pause-1',
      context: 'ctx',
      pendingOffer: false,
      created: true,
      silentStubPersisted: true,
    });
    const ports = mockPorts();
    const result = await openManualPauseFromHome(ports, {
      userId: 'u1',
      silentMode: true,
      contextText: 'ctx',
      silentMessage: 'BTC moved.',
      changePercent: 2,
      cumulativeChangePercent: 1,
      trackedAssetId: 'bitcoin',
      severityBand: 'mild',
      fearGreedLabel: 'Fear',
      onChainBand: '1:2:3',
    });
    expect(result).toMatchObject({
      outcome: 'opened',
      instanceId: 'pause-1',
      silentStubPersisted: true,
    });
    expect(runOpenManualPauseSilentModeAfterCreateMock).toHaveBeenCalledWith(ports.reflect, {
      pauseInstanceId: 'pause-1',
      userId: 'u1',
      contextText: 'ctx',
      silentMessage: 'BTC moved.',
      pendingOffer: false,
      created: true,
    });
  });

  it('returns error when silent stub persist fails', async () => {
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: 'pause-1',
      created: true,
      reused_reason: null,
      pending_offer: false,
      prior_open_instance_id: null,
    });
    runOpenManualPauseSilentModeAfterCreateMock.mockResolvedValue({
      outcome: 'error',
      userMessage: 'Could not save reflection.',
      isNetwork: false,
    });
    const result = await openManualPauseFromHome(mockPorts(), {
      userId: 'u1',
      silentMode: true,
      contextText: 'ctx',
      silentMessage: 'BTC moved.',
      changePercent: 2,
      cumulativeChangePercent: 1,
      trackedAssetId: 'bitcoin',
      severityBand: 'mild',
      fearGreedLabel: null,
      onChainBand: null,
    });
    expect(result).toEqual({
      outcome: 'error',
      userMessage: 'Could not save reflection.',
      isNetwork: false,
    });
  });

  it('skips artifact persist for non-silent opens', async () => {
    runPauseCreateOrReuseMock.mockResolvedValue({
      instance_id: 'pause-2',
      created: true,
      reused_reason: null,
      pending_offer: true,
      prior_open_instance_id: null,
    });
    const result = await openManualPauseFromHome(mockPorts(), {
      userId: 'u1',
      silentMode: false,
      contextText: 'ctx',
      silentMessage: 'BTC moved.',
      changePercent: 2,
      cumulativeChangePercent: null,
      trackedAssetId: 'bitcoin',
      severityBand: 'mild',
      fearGreedLabel: null,
      onChainBand: null,
    });
    expect(result).toMatchObject({
      outcome: 'opened',
      pendingOffer: true,
      silentStubPersisted: false,
    });
    expect(runOpenManualPauseSilentModeAfterCreateMock).not.toHaveBeenCalled();
  });
});
