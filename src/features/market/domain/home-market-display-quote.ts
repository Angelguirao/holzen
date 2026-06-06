import type { FearGreedData, MarketQuote } from '@/features/market/domain/market-quote';

export type HomeMarketDisplayQuoteInput = {
  marketData: MarketQuote | null;
  openPauseSource?: string | null;
  openPauseState?: 'active' | 'engaged' | null;
  openPauseContextSnapshot?: Record<string, unknown> | null;
};

function isOpenCronPause(input: HomeMarketDisplayQuoteInput): boolean {
  return (
    input.openPauseSource === 'cron_volatility' &&
    (input.openPauseState === 'active' || input.openPauseState === 'engaged')
  );
}

function fearGreedFromSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): FearGreedData | undefined {
  const raw = snapshot?.fear_greed;
  if (!raw || typeof raw !== 'object') return undefined;
  const value = (raw as { value?: unknown }).value;
  const label = (raw as { label?: unknown }).label;
  if (typeof value !== 'number' || !Number.isFinite(value) || typeof label !== 'string') {
    return undefined;
  }
  return { value, label };
}

function directionFromSnapshot(
  snapshot: Record<string, unknown>,
  snapPct: number,
): 'up' | 'down' {
  if (snapshot.direction === 'down' || snapshot.direction === 'up') {
    return snapshot.direction;
  }
  return snapPct >= 0 ? 'up' : 'down';
}

function snapshotChangePercent(
  snapshot: Record<string, unknown>,
): number | null {
  const raw = snapshot.change_24h_pct;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Home Market strip: keep live price, align 24h move + F&G with open cron pause snapshot
 * when the cached quote may lag behind the server trigger (same rule as footer range status).
 */
export function resolveHomeMarketDisplayQuote(
  input: HomeMarketDisplayQuoteInput,
): MarketQuote | null {
  const { marketData, openPauseContextSnapshot } = input;
  if (!marketData) return null;
  if (!isOpenCronPause(input) || !openPauseContextSnapshot) return marketData;

  const snapPct = snapshotChangePercent(openPauseContextSnapshot);
  if (snapPct == null) return marketData;

  const direction = directionFromSnapshot(openPauseContextSnapshot, snapPct);
  const fearGreed = fearGreedFromSnapshot(openPauseContextSnapshot) ?? marketData.fearGreed;
  const currentPrice = marketData.currentPrice;
  const price24hAgo =
    Number.isFinite(currentPrice) && currentPrice > 0
      ? currentPrice / (1 + snapPct / 100)
      : marketData.price24hAgo;

  const { _stale: _dropStale, ...liveQuote } = marketData;

  return {
    ...liveQuote,
    changePercent: snapPct,
    direction,
    price24hAgo,
    fearGreed,
  };
}
