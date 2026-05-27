import { describe, expect, it } from 'vitest';
import {
  mergeHistoryBtcOverlay,
  toHistoricalInsightDisplayData,
} from './historical-insight-payload';
import { toZoomOutDisplayData } from './zoom-out-payload';

describe('historical-insight-payload', () => {
  it('toHistoricalInsightDisplayData parses BTC overlay fields', () => {
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
      btcInsight: 'body',
      currentPrice: 100_000,
      partial: true,
      onThisDay: [{ yearsAgo: 1, price: 50_000, date: '2024-05-01' }],
    });
  });

  it('mergeHistoryBtcOverlay keeps history prices when present', () => {
    const history = toHistoricalInsightDisplayData({
      title: 'H',
      onThisDay: [{ yearsAgo: 2, price: 20_000, date: '2022-05-01' }],
      currentPrice: 90_000,
    });
    const zoomOut = toZoomOutDisplayData({
      onThisDay: [{ yearsAgo: 1, price: 40_000, date: '2024-05-01' }],
      currentPrice: 100_000,
    });
    expect(mergeHistoryBtcOverlay(history, zoomOut)?.currentPrice).toBe(90_000);
  });

  it('mergeHistoryBtcOverlay falls back to zoom-out BTC rows for legacy sessions', () => {
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
    expect(mergeHistoryBtcOverlay(history, zoomOut)).toMatchObject({
      title: 'H',
      btcInsight: 'insight',
      currentPrice: 100_000,
      partial: true,
      onThisDay: [{ yearsAgo: 3, price: 10_000, date: '2021-05-01' }],
    });
  });
});
