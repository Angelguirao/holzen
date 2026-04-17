/**
 * Shared CoinGecko helpers.
 *
 * Adds the `x-cg-demo-api-key` header when the COINGECKO_API_KEY secret is set.
 * Without the key, requests fall back to the shared free-tier IP pool (subject
 * to 429 rate limits and 401s on certain endpoints).
 */
export function coingeckoHeaders(): HeadersInit {
  const key = Deno.env.get("COINGECKO_API_KEY");
  return key ? { "x-cg-demo-api-key": key } : {};
}
