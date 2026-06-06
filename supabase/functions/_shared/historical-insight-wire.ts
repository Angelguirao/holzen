/** Wire/cache helpers for Look Back `historical_insight` payloads. */

export function resolveMarketInsight(
  content: Record<string, unknown> | null | undefined,
): string {
  if (!content) return "";
  const market = content.marketInsight;
  if (typeof market === "string" && market.trim().length > 0) return market.trim();
  const legacy = content.btcInsight;
  if (typeof legacy === "string" && legacy.trim().length > 0) return legacy.trim();
  return "";
}

/** Normalize LLM/cache rows to canonical `marketInsight` (drops legacy `btcInsight` on write). */
export function normalizeHistoricalInsightContent<T extends Record<string, unknown>>(
  content: T,
): T & { marketInsight: string } {
  const marketInsight = resolveMarketInsight(content);
  const out = { ...content, marketInsight } as T & { marketInsight: string };
  delete (out as Record<string, unknown>).btcInsight;
  return out;
}

export function hasHistoricalInsightBody(content: Record<string, unknown>): boolean {
  return resolveMarketInsight(content).length > 0;
}
