/**
 * Shared CoinGecko helpers.
 *
 * Adds the `x-cg-demo-api-key` header when the COINGECKO_API_KEY secret is set.
 * Without the key, requests fall back to the shared free-tier IP pool (subject
 * to 429 rate limits and 401s on certain endpoints).
 */
import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";

export function coingeckoHeaders(): HeadersInit {
  const key = Deno.env.get("COINGECKO_API_KEY");
  return key ? { "x-cg-demo-api-key": key } : {};
}

export { dateKeyToCoinGeckoHistory } from "./coingecko-util.ts";
import { dateKeyToCoinGeckoHistory } from "./coingecko-util.ts";

/**
 * Fetch BTC USD price for a single UTC calendar date via CoinGecko's
 * `/coins/bitcoin/history` endpoint.
 *
 * This endpoint works on the **free / demo** tier for **any historical date**
 * (unlike `/market_chart/range`, which effectively caps the free tier at the
 * last ~365 days and silently returns empty arrays for older ranges — which is
 * the bug that left Zoom Out's anniversary rows at 0/10).
 *
 * Response shape: `{ market_data: { current_price: { usd: number } } }`.
 * Returns:
 *   - `{ price }`              on success,
 *   - `{ rateLimited: true }`  on HTTP 429,
 *   - `null`                   on other non-OK responses (caller decides whether
 *                              to abort or try the next date).
 *
 * Uses `AbortSignal.timeout(8000)` so a single slow call can't stall the whole
 * cron loop.
 */
export async function fetchCoinGeckoHistoryPrice(
  dateKey: string,
  incoming?: Request,
): Promise<{ price: number } | { rateLimited: true } | null> {
  const formatted = dateKeyToCoinGeckoHistory(dateKey);
  if (!formatted) return null;

  let res: Response;
  try {
    res = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formatted}&localization=false`,
      fetchInitWithIncomingTrace(incoming, {
        headers: coingeckoHeaders(),
        signal: AbortSignal.timeout(8000),
      }),
    );
  } catch {
    return null;
  }

  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) return null;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  const price = (json as { market_data?: { current_price?: { usd?: unknown } } })
    ?.market_data?.current_price?.usd;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return { price: Math.round(price) };
}
