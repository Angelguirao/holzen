/**
 * Home “Your pause” preview: only the 24h BTC move sentence and the Fear & Greed
 * sentence from persisted `context_text`.
 */
export function parsePauseContextForHomePreview(context: string | null): {
  btc24h: string | null;
  marketSentiment: string | null;
} {
  if (!context?.trim()) return { btc24h: null, marketSentiment: null };
  const s = context.trim();
  const btc = s.match(/BTC is (?:up|down) [\d.]+% in the last 24 hours\./i);
  const sentiment = s.match(/Market sentiment:\s*.+?\(\d{1,3}\/100\)\./i);
  return {
    btc24h: btc ? btc[0] : null,
    marketSentiment: sentiment ? sentiment[0].trim() : null,
  };
}
