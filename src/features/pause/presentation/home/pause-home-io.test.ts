import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './pause-home-io';

describe('pause-home-io', () => {
  it('re-exports manual-open market context for Home presentation conductors', () => {
    const market = buildManualPauseMarketContext(
      {
        changePercent: 2,
        cumulativeChangePercent: 3,
        fearGreed: { label: 'Fear' },
        onChain: null,
      },
      5,
      'bitcoin',
    );
    expect(market.assetId).toBe('bitcoin');
    expect(market.ctx.length).toBeGreaterThan(0);
    expect(market.silentMsg.length).toBeGreaterThan(0);
  });

  it('re-exports manual-open create-or-reuse builder for Home test seams', () => {
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe('volatility_v1');
  });

  it('re-exports buildManualPauseOpenParams and default manual-open ports', () => {
    const params = buildManualPauseOpenParams({
      userId: 'u1',
      silentMode: false,
      data: {
        changePercent: 1,
        cumulativeChangePercent: 2,
        fearGreed: null,
        onChain: null,
      },
      cumulativeThreshold: 5,
      profileTrackedAssetId: 'bitcoin',
    });
    expect(params.userId).toBe('u1');
    expect(params.trackedAssetId).toBe('bitcoin');
    expect(pauseHomeManualOpenPorts.repository).toBeDefined();
    expect(pauseHomeManualOpenPorts.reflect).toBeDefined();
  });

  it('re-exports silent-mode reflect use cases for Home test seams', () => {
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
  });
});
