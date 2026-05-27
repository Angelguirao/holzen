import type { BtcPriceData } from '@/features/market/domain/market-quote';
import { parsePauseContextForHomePreview } from '@/features/market/application/pause-context-home-preview';
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
  const arrow = match[1].toLowerCase() === 'down' ? '↓' : '↑';
  return `${assetSymbol} ${arrow} ${match[2]}% · 24h`;
}

function compactSentimentFromContext(marketSentiment: string | null): string | null {
  if (!marketSentiment) return null;
  const match = marketSentiment.match(/Market sentiment:\s*(.+?)\s*\((\d{1,3})\/100\)\./i);
  if (!match) return marketSentiment.trim();
  return `${match[1].trim()} · ${match[2]}`;
}

function compactMoveFromLiveBtc(data: BtcPriceData, assetSymbol: string): string {
  const arrow = data.direction === 'down' ? '↓' : '↑';
  const pct = Math.abs(data.changePercent).toFixed(1);
  return `${assetSymbol} ${arrow} ${pct}% · 24h`;
}

function compactSentimentFromLiveBtc(data: BtcPriceData): string | null {
  const fg = data.fearGreed;
  if (!fg?.label || typeof fg.value !== 'number') return null;
  return `${fg.label} · ${fg.value}`;
}

/** Formats the compact BTC/F&G block for Home pause widget states B/C. */
export function formatHomePauseMarketBlock(input: {
  contextText: string | null;
  btcData: BtcPriceData | null;
  trackedAssetId: string;
  instanceCreatedAt: string | null;
}): HomePauseMarketBlock {
  const assetSymbol = trackedAssetSymbol(input.trackedAssetId);
  const parsed = parsePauseContextForHomePreview(input.contextText);

  const moveLine =
    compactMoveFromContext(parsed.btc24h, assetSymbol) ??
    (input.btcData ? compactMoveFromLiveBtc(input.btcData, assetSymbol) : null);

  const sentimentLine =
    compactSentimentFromContext(parsed.marketSentiment) ??
    (input.btcData ? compactSentimentFromLiveBtc(input.btcData) : null);

  return {
    moveLine,
    sentimentLine,
    updatedAtIso: input.instanceCreatedAt,
  };
}
