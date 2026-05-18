import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import { isPausePersistError } from '@/features/pause/application/use-cases/reflection-persist-error';

/** Buckets for Home pause widget + zen error copy (aligned with `useHolzen` setError strings). */
export type PauseHomeErrorKind = 'persist' | 'network' | 'ai' | 'generic';

export function pauseHomeErrorKind(error: string | null): PauseHomeErrorKind | null {
  if (!error) return null;
  if (isPausePersistError(error)) return 'persist';
  const e = error.toLowerCase();
  if (
    e.includes('fetch') ||
    e.includes('network') ||
    e.includes('failed to fetch') ||
    e.includes('could not reach holzen') ||
    e.includes('could not connect') ||
    e.includes('check your internet') ||
    e.includes('check your connection')
  ) {
    return 'network';
  }
  // Reflect-step AI errors surface on `/pause`, not Home (non-silent manual only creates the instance).
  if (
    e.includes('ai pause') ||
    e.includes('pause message could not') ||
    e.includes('too many requests')
  ) {
    return 'ai';
  }
  return 'generic';
}

/** User-facing title + optional subtitle for the Home pause error panel (zen + widget). */
export function pauseHomeErrorStrings(
  t: TFunction,
  error: string,
): { title: string; description: string | null } {
  const kind = pauseHomeErrorKind(error);
  if (kind === 'persist') return { title: error, description: null };
  if (kind === 'network') {
    return {
      title: t('home.errors.couldNotReachPrice'),
      description: t('home.errors.checkConnection'),
    };
  }
  if (kind === 'ai') {
    return {
      title: t('home.errors.aiUnavailable'),
      description: t('home.errors.aiTemporarilyUnavailable'),
    };
  }
  return {
    title: t('home.errors.somethingWentWrong'),
    description: t('home.errors.unexpectedError'),
  };
}

/**
 * Market fetch failures from `useHolzen` / `fetchBtcDisplay` — user still has cached
 * `btcData` we can show in the market widget, so the pause strip should not steal focus.
 */
export function isLikelyPriceOnlyMarketError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes('coingecko') ||
    e.includes('could not check market data') ||
    (e.includes('market data') && e.includes('retry'))
  );
}

/**
 * Whether Home should show the blocking pause error UI (full widget or zen) instead of
 * the empty / scheduling flow. Persist errors always surface; with cached prices, only
 * non–price-only errors surface so reflection / AI / connectivity issues stay visible.
 */
export function shouldSurfacePauseWidgetError(
  error: string | null,
  btcData: BtcPriceData | null,
): boolean {
  if (!error) return false;
  if (isPausePersistError(error)) return true;
  if (!btcData) return true;
  return !isLikelyPriceOnlyMarketError(error);
}
