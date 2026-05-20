import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import {
  HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR,
  HOLZEN_MARKET_DISPLAY_RETRY_ERROR,
  type BtcPriceData,
} from '@/features/market/public';
import { PAUSE_PERSIST_ERROR_MARKER } from '@/features/pause/application/use-cases/ritual/reflect/reflection-persist-error';
import {
  isLikelyPriceOnlyMarketError,
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldShowHomePauseSectionSnooze,
  shouldSurfacePauseWidgetError,
} from './pause-home-widget-error';

const echoT: TFunction = ((key: string) => key) as TFunction;

const sampleBtc: BtcPriceData = {
  coinId: 'bitcoin',
  currentPrice: 100_000,
  price24hAgo: 99_000,
  changePercent: 1,
  direction: 'up',
  currency: 'USD',
};

describe('shouldShowHomePauseSectionSnooze', () => {
  it('shows snooze only when subscription is ready and user has access', () => {
    expect(shouldShowHomePauseSectionSnooze(true, true)).toBe(true);
    expect(shouldShowHomePauseSectionSnooze(false, true)).toBe(false);
    expect(shouldShowHomePauseSectionSnooze(true, false)).toBe(false);
  });
});

describe('isLikelyPriceOnlyMarketError', () => {
  it('matches CoinGecko copy from useHolzen', () => {
    expect(isLikelyPriceOnlyMarketError(HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR)).toBe(true);
  });

  it('matches generic market check copy', () => {
    expect(isLikelyPriceOnlyMarketError(HOLZEN_MARKET_DISPLAY_RETRY_ERROR)).toBe(true);
  });

  it('does not match reflection / manual trigger errors', () => {
    expect(isLikelyPriceOnlyMarketError('Could not reach Holzen. Check your connection.')).toBe(false);
    expect(
      isLikelyPriceOnlyMarketError('A pause message could not be generated right now. Try again in a moment.'),
    ).toBe(false);
  });
});

describe('pauseHomeErrorStrings', () => {
  it('returns raw title for persist errors', () => {
    const msg = `${PAUSE_PERSIST_ERROR_MARKER}. Try again.`;
    expect(pauseHomeErrorStrings(echoT, msg)).toEqual({ title: msg, description: null });
  });

  it('maps network kind to i18n keys', () => {
    expect(pauseHomeErrorStrings(echoT, 'Could not reach Holzen. Check your connection.')).toEqual({
      title: 'home.errors.couldNotReachPrice',
      description: 'home.errors.checkConnection',
    });
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

  it('does not treat reflect-step wording as a Home AI failure', () => {
    expect(pauseHomeErrorKind('holzen-reflect timed out')).toBe('generic');
    expect(pauseHomeErrorKind('Could not generate reflection')).toBe('generic');
  });
});

describe('shouldSurfacePauseWidgetError', () => {
  it('surfaces persist errors even with cached btcData', () => {
    expect(shouldSurfacePauseWidgetError(`${PAUSE_PERSIST_ERROR_MARKER}. Try again.`, sampleBtc)).toBe(
      true,
    );
  });

  it('hides price-only errors when btcData exists', () => {
    expect(shouldSurfacePauseWidgetError(HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR, sampleBtc)).toBe(false);
  });

  it('shows price errors when there is no cached btcData', () => {
    expect(shouldSurfacePauseWidgetError(HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR, null)).toBe(true);
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
