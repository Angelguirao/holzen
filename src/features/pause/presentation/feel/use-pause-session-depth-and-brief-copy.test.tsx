import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));
import { renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { MarketQuote } from '@/features/market/public';
import { usePauseSessionDepthAndBriefCopy } from './use-pause-session-depth-and-brief-copy';

const t = ((key: string, opts?: Record<string, unknown>) =>
  key === 'pause.depthPicker.contextMoved'
    ? `${opts?.sym} ${opts?.pct}`
    : key) as TFunction;

const sampleBtc = (changePercent: number): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: 'down',
  currency: 'USD',
});

describe('usePauseSessionDepthAndBriefCopy', () => {
  it('returns null depth line when marketData is missing', () => {
    const { result } = renderHook(() =>
      usePauseSessionDepthAndBriefCopy({
        t,
        marketData: null,
        trackedAssetId: 'btc',
        ritualEntry: 'picker',
      }),
    );
    expect(result.current.depthContextLine).toBeNull();
  });

  it('builds depth line from btc change and tracked symbol', () => {
    const { result } = renderHook(() =>
      usePauseSessionDepthAndBriefCopy({
        t,
        marketData: sampleBtc(-2.5),
        trackedAssetId: 'btc',
        ritualEntry: 'picker',
      }),
    );
    expect(result.current.depthContextLine).toContain('2.5');
  });
});
