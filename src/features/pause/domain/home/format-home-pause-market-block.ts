import type { MarketQuote } from '@/features/market/domain/market-quote';
import { parsePauseContextForHomePreview } from '@/features/market/application/pause-context-home-preview';
import {
  formatCompactMarketSentimentFromContextText,
  formatCompactMarketSentimentFromFearGreed,
} from '@/features/market/application/format-compact-market-sentiment-line';
import { fearGreedFromPauseContextSnapshot } from '@/features/market/domain/home-market-display-quote';
import { trackedAssetSymbol } from '@/features/market/domain/tracked-assets';

export type HomePauseMarketBlock = {
  /** Compact line e.g. "BTC ↓ 1.1% · 24h" */
  moveLine: string | null;
  /** Compact sentiment e.g. "Fear · 33" */
  sentimentLine: string | null;
  /** ISO timestamp for "Updated HH:mm" */
  updatedAtIso: string | null;
};

function compactMoveFromContext(btc24h: string | null, assetSymbol: string): string | null {
  if (!btc24h) return null;
  const match = btc24h.match(
    new RegExp(`${assetSymbol} is (up|down) ([\\d.]+)% in the last 24 hours\\.`, 'i'),
  );
  if (!match) return btc24h;
  const arrow = match[1].toLowerCase() === 'down' ? '▼' : '▲';
  return `${assetSymbol} ${arrow} ${match[2]}% · 24h`;
}

function compactSentimentFromContext(marketSentiment: string | null): string | null {
  return formatCompactMarketSentimentFromContextText(marketSentiment);
}

function compactMoveFromLiveQuote(data: MarketQuote, assetSymbol: string): string {
  const arrow = data.direction === 'down' ? '▼' : '▲';
  const pct = Math.abs(data.changePercent).toFixed(1);
  return `${assetSymbol} ${arrow} ${pct}% · 24h`;
}

function compactSentimentFromLiveQuote(data: MarketQuote): string | null {
  return formatCompactMarketSentimentFromFearGreed(data.fearGreed);
}

/** Formats the compact BTC/F&G block for Home pause widget states B/C (Figma 559:26757). */
export function formatHomePauseMarketBlock(input: {
  contextText: string | null;
  contextSnapshot?: Record<string, unknown> | null;
  marketData: MarketQuote | null;
  trackedAssetId: string;
  instanceCreatedAt: string | null;
}): HomePauseMarketBlock {
  const assetSymbol = trackedAssetSymbol(input.trackedAssetId);
  const parsed = parsePauseContextForHomePreview(input.contextText);
  const snapshotFearGreed = fearGreedFromPauseContextSnapshot(input.contextSnapshot);

  const moveLine =
    compactMoveFromContext(parsed.btc24h, assetSymbol) ??
    (input.marketData ? compactMoveFromLiveQuote(input.marketData, assetSymbol) : null);

  const sentimentLine =
    compactSentimentFromContext(parsed.marketSentiment) ??
    formatCompactMarketSentimentFromFearGreed(snapshotFearGreed) ??
    (input.marketData ? compactSentimentFromLiveQuote(input.marketData) : null);

  return {
    moveLine,
    sentimentLine,
    updatedAtIso: input.instanceCreatedAt,
  };
}
