import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bucketChangePercent,
  computeContextFingerprint,
} from '@/features/pause/domain/pause-fingerprint';
import {
  buildManualPauseCreateOrReuseParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
} from './build-manual-pause-create-or-reuse-params';

vi.mock('@/features/pause/domain/pause-fingerprint', () => ({
  bucketChangePercent: vi.fn((pct: number) => pct),
  computeContextFingerprint: vi.fn(),
}));

const bucketChangePercentMock = vi.mocked(bucketChangePercent);
const computeContextFingerprintMock = vi.mocked(computeContextFingerprint);

const baseParams = {
  userId: 'u1',
  silentMode: false,
  contextText: 'ctx',
  silentMessage: 'BTC moved.',
  changePercent: 3,
  cumulativeChangePercent: 4,
  trackedAssetId: 'bitcoin',
  severityBand: 'mild',
  fearGreedLabel: 'fear',
  onChainBand: 'low',
} as const;

describe('buildManualPauseCreateOrReuseParams', () => {
  beforeEach(() => {
    bucketChangePercentMock.mockImplementation((pct: number) => pct);
    computeContextFingerprintMock.mockReset();
    computeContextFingerprintMock.mockResolvedValue('fp-test');
  });

  it('builds volatility manual create params with fingerprint', async () => {
    const result = await buildManualPauseCreateOrReuseParams(baseParams);

    expect(computeContextFingerprintMock).toHaveBeenCalledWith({
      templateSlug: MANUAL_PAUSE_VOLATILITY_TEMPLATE,
      directionBucket: 'up',
      severityBand: 'mild',
      dailyBucketPct: 3,
      cumulativeBucketPct: 4,
      trackedAssetId: 'bitcoin',
      fearGreedBand: 'fear',
      onChainBand: 'low',
    });
    expect(result).toEqual({
      templateSlug: MANUAL_PAUSE_VOLATILITY_TEMPLATE,
      source: 'manual',
      contextSnapshot: {
        change_24h_pct: 3,
        change_7d_pct: 4,
        direction: 'up',
        severity: 'mild',
        context_text: 'ctx',
        last_reported_mood: null,
        tracked_asset_id: 'bitcoin',
      },
      contextRuleResult: { triggered: ['manual'] },
      contextFingerprint: 'fp-test',
    });
  });

  it('uses down direction bucket for negative change', async () => {
    const result = await buildManualPauseCreateOrReuseParams({
      ...baseParams,
      changePercent: -2,
      cumulativeChangePercent: null,
      mood: 'calm',
    });

    expect(computeContextFingerprintMock).toHaveBeenCalledWith(
      expect.objectContaining({ directionBucket: 'down' }),
    );
    expect(result.contextSnapshot.direction).toBe('down');
    expect(result.contextSnapshot.last_reported_mood).toBe('calm');
    expect(result.contextSnapshot.change_7d_pct).toBeNull();
  });
});
