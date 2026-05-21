import { describe, expect, it, vi } from 'vitest';
import { openManualPauseFromHome } from './open-manual-pause-from-home';

describe('openManualPauseFromHome', () => {
  it('returns idle when RPC yields no instance', async () => {
    const result = await openManualPauseFromHome(
      {
        repository: {
          createOrReuse: vi.fn().mockResolvedValue({
            instance_id: null,
            created: false,
            reused_reason: 'fingerprint_match',
            pending_offer: false,
            prior_open_instance_id: null,
          }),
        },
        reflect: { persistReflectionArtifacts: vi.fn() },
      },
      {
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
      },
    );
    expect(result.outcome).toBe('idle');
  });

  it('persists silent stub when silentMode is on', async () => {
    const persistReflectionArtifacts = vi.fn().mockResolvedValue(undefined);
    const result = await openManualPauseFromHome(
      {
        repository: {
          createOrReuse: vi.fn().mockResolvedValue({
            instance_id: 'pause-1',
            created: true,
            reused_reason: null,
            pending_offer: false,
            prior_open_instance_id: null,
          }),
        },
        reflect: { persistReflectionArtifacts },
      },
      {
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
      },
    );
    expect(result).toMatchObject({
      outcome: 'opened',
      instanceId: 'pause-1',
      silentStubPersisted: true,
    });
    expect(persistReflectionArtifacts).toHaveBeenCalledWith({
      pauseInstanceId: 'pause-1',
      userId: 'u1',
      context: 'ctx',
      message: 'BTC moved.',
    });
  });

  it('skips artifact persist for non-silent opens', async () => {
    const persistReflectionArtifacts = vi.fn();
    const result = await openManualPauseFromHome(
      {
        repository: {
          createOrReuse: vi.fn().mockResolvedValue({
            instance_id: 'pause-2',
            created: true,
            reused_reason: null,
            pending_offer: true,
            prior_open_instance_id: null,
          }),
        },
        reflect: { persistReflectionArtifacts },
      },
      {
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
      },
    );
    expect(result).toMatchObject({
      outcome: 'opened',
      pendingOffer: true,
      silentStubPersisted: false,
    });
    expect(persistReflectionArtifacts).not.toHaveBeenCalled();
  });
});
