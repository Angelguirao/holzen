import type { FearGreedData } from '@/features/market/domain/market-quote';

/** Compact sentiment e.g. "Fear · 32" (Figma depth picker / Home pause widget). */
export function formatCompactMarketSentimentFromFearGreed(
  fearGreed: FearGreedData | null | undefined,
): string | null {
  if (!fearGreed?.label || typeof fearGreed.value !== 'number') return null;
  return `${fearGreed.label} · ${fearGreed.value}`;
}

/** Parses persisted pause `context_text` sentence into compact sentiment. */
export function formatCompactMarketSentimentFromContextText(
  marketSentiment: string | null | undefined,
): string | null {
  if (!marketSentiment?.trim()) return null;
  const match = marketSentiment.match(/Market sentiment:\s*(.+?)\s*\((\d{1,3})\/100\)\./i);
  if (!match) return marketSentiment.trim();
  return `${match[1].trim()} · ${match[2]}`;
}
