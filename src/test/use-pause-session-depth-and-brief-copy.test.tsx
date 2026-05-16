import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/lib/btc';
import { usePauseSessionDepthAndBriefCopy } from '@/hooks/use-pause-session-depth-and-brief-copy';

const t = ((key: string, opts?: Record<string, unknown>) =>
  key === 'pause.depthPicker.contextMoved'
    ? `${opts?.sym} ${opts?.pct}`
    : key) as TFunction;

const sampleBtc = (changePercent: number): BtcPriceData => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: 'down',
  currency: 'USD',
});

describe('usePauseSessionDepthAndBriefCopy', () => {
  it('returns null depth line when btcData is missing', () => {
    const { result } = renderHook(() =>
      usePauseSessionDepthAndBriefCopy({
        t,
        btcData: null,
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
        btcData: sampleBtc(-2.5),
        trackedAssetId: 'btc',
        ritualEntry: 'picker',
      }),
    );
    expect(result.current.depthContextLine).toContain('2.5');
  });
});
