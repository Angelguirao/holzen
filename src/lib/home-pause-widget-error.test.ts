import { describe, expect, it } from 'vitest';
import type { BtcPriceData } from '@/lib/btc';
import { PAUSE_PERSIST_ERROR_MARKER } from '@/lib/reflection-persist-error';
import {
  isLikelyPriceOnlyMarketError,
  pauseHomeErrorKind,
  shouldSurfacePauseWidgetError,
} from '@/lib/home-pause-widget-error';

const sampleBtc: BtcPriceData = {
  coinId: 'bitcoin',
  currentPrice: 100_000,
  price24hAgo: 99_000,
  changePercent: 1,
  direction: 'up',
  currency: 'USD',
};

describe('isLikelyPriceOnlyMarketError', () => {
  it('matches CoinGecko copy from useHolzen', () => {
    expect(
      isLikelyPriceOnlyMarketError('Price data unavailable. CoinGecko may be down — retrying shortly.'),
    ).toBe(true);
  });

  it('matches generic market check copy', () => {
    expect(isLikelyPriceOnlyMarketError('Could not check market data. Will retry automatically.')).toBe(
      true,
    );
  });

  it('does not match reflection / manual trigger errors', () => {
    expect(isLikelyPriceOnlyMarketError('Could not reach Holzen. Check your connection.')).toBe(false);
    expect(
      isLikelyPriceOnlyMarketError('A pause message could not be generated right now. Try again in a moment.'),
    ).toBe(false);
  });
});

describe('pauseHomeErrorKind', () => {
  it('classifies useHolzen connectivity copy', () => {
    expect(pauseHomeErrorKind('Could not reach Holzen. Check your connection.')).toBe('network');
    expect(pauseHomeErrorKind('Could not connect. Check your internet and try again.')).toBe('network');
  });

  it('classifies AI / rate-limit style copy', () => {
    expect(pauseHomeErrorKind('AI pause prompt unavailable right now. Try again shortly.')).toBe('ai');
    expect(pauseHomeErrorKind('Too many requests — please wait a moment and try again.')).toBe('ai');
    expect(
      pauseHomeErrorKind('A pause message could not be generated right now. Try again in a moment.'),
    ).toBe('ai');
  });
});

describe('shouldSurfacePauseWidgetError', () => {
  it('surfaces persist errors even with cached btcData', () => {
    expect(shouldSurfacePauseWidgetError(`${PAUSE_PERSIST_ERROR_MARKER}. Try again.`, sampleBtc)).toBe(
      true,
    );
  });

  it('hides price-only errors when btcData exists', () => {
    expect(
      shouldSurfacePauseWidgetError(
        'Price data unavailable. CoinGecko may be down — retrying shortly.',
        sampleBtc,
      ),
    ).toBe(false);
  });

  it('shows price errors when there is no cached btcData', () => {
    expect(
      shouldSurfacePauseWidgetError(
        'Price data unavailable. CoinGecko may be down — retrying shortly.',
        null,
      ),
    ).toBe(true);
  });

  it('shows AI / connectivity errors even with cached btcData', () => {
    expect(shouldSurfacePauseWidgetError('Could not reach Holzen. Check your connection.', sampleBtc)).toBe(
      true,
    );
    expect(
      shouldSurfacePauseWidgetError(
        'A pause message could not be generated right now. Try again in a moment.',
        sampleBtc,
      ),
    ).toBe(true);
  });
});
