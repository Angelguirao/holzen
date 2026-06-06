import { describe, expect, it } from 'vitest';
import {
  mergeHistoryBtcOverlay,
  mergeHistoryMarketOverlay,
  toHistoricalInsightDisplayData,
} from './historical-insight-payload';
import { toZoomOutDisplayData } from './zoom-out-payload';

describe('historical-insight-payload', () => {
  it('toHistoricalInsightDisplayData parses market overlay fields from btcInsight', () => {
    expect(
      toHistoricalInsightDisplayData({
        title: 'T',
        btcInsight: 'body',
        onThisDay: [{ yearsAgo: 1, price: 50_000, date: '2024-05-01' }],
        currentPrice: 100_000,
        partial: true,
      }),
    ).toMatchObject({
      title: 'T',
      marketInsight: 'body',
      btcInsight: 'body',
      currentPrice: 100_000,
      partial: true,
      onThisDay: [{ yearsAgo: 1, price: 50_000, date: '2024-05-01' }],
    });
  });

  it('toHistoricalInsightDisplayData prefers marketInsight over btcInsight', () => {
    expect(
      toHistoricalInsightDisplayData({
        marketInsight: 'canonical',
        btcInsight: 'legacy',
      }),
    ).toMatchObject({
      marketInsight: 'canonical',
      btcInsight: 'canonical',
    });
  });

  it('mergeHistoryMarketOverlay keeps history prices when present', () => {
    const history = toHistoricalInsightDisplayData({
      title: 'H',
      onThisDay: [{ yearsAgo: 2, price: 20_000, date: '2022-05-01' }],
      currentPrice: 90_000,
    });
    const zoomOut = toZoomOutDisplayData({
      onThisDay: [{ yearsAgo: 1, price: 40_000, date: '2024-05-01' }],
      currentPrice: 100_000,
    });
    expect(mergeHistoryMarketOverlay(history, zoomOut)?.currentPrice).toBe(90_000);
  });

  it('mergeHistoryMarketOverlay falls back to zoom-out rows for legacy sessions', () => {
    const history = toHistoricalInsightDisplayData({
      title: 'H',
      btcInsight: 'insight',
      onThisDay: [],
      currentPrice: null,
    });
    const zoomOut = toZoomOutDisplayData({
      onThisDay: [{ yearsAgo: 3, price: 10_000, date: '2021-05-01' }],
      currentPrice: 100_000,
      partial: true,
    });
    expect(mergeHistoryMarketOverlay(history, zoomOut)).toMatchObject({
      title: 'H',
      marketInsight: 'insight',
      currentPrice: 100_000,
      partial: true,
      onThisDay: [{ yearsAgo: 3, price: 10_000, date: '2021-05-01' }],
    });
  });

  it('mergeHistoryBtcOverlay remains a deprecated alias', () => {
    expect(mergeHistoryBtcOverlay).toBe(mergeHistoryMarketOverlay);
  });
});
