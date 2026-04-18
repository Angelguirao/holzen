/**
 * Pure helpers for CoinGecko URL formatting. Extracted from `coingecko.ts` so
 * they can be unit-tested under Vitest without pulling in `Deno.env`.
 */

/**
 * Convert a `YYYY-MM-DD` date key into CoinGecko's `/coins/:id/history?date=`
 * format, which is `DD-MM-YYYY`. Returns `null` for malformed input so callers
 * can short-circuit instead of issuing a doomed request.
 *
 * The format mismatch is the most common foot-gun when wiring this endpoint —
 * passing `YYYY-MM-DD` directly returns 400 / no data without a clear error.
 */
export function dateKeyToCoinGeckoHistory(dateKey: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-");

  // Validate: Date.UTC ignores out-of-range month/day, so round-trip the ISO
  // slice to catch inputs like "2024-02-30" or "2024-13-01".
  const month = Number(m);
  const day = Number(d);
  const year = Number(y);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const ms = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(ms)) return null;
  if (new Date(ms).toISOString().slice(0, 10) !== dateKey) return null;

  return `${d}-${m}-${y}`;
}
