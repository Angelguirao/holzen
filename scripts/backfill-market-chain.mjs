/**
 * Chain `backfill-market-prices` until `completed: true` (long spans, e.g. 10 years).
 *
 * Env (same as Bruno service-cron):
 *   SUPABASE_URL or VITE_SUPABASE_URL — project URL (no trailing slash)
 *   SERVICE_CRON_BEARER or SUPABASE_SERVICE_ROLE_KEY — Bearer for verifyServiceAuth
 *   VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY — `apikey` header
 *
 * Usage:
 *   node scripts/backfill-market-chain.mjs 2016-04-14 2026-04-14
 *
 * Pauses 3s between invocations to reduce CoinGecko 429 risk.
 */

const base = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const bearer = process.env.SERVICE_CRON_BEARER ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

let from = process.argv[2];
const to = process.argv[3];

if (!base || !bearer || !anon) {
  console.error("Missing env: SUPABASE_URL or VITE_SUPABASE_URL, SERVICE_CRON_BEARER (or SUPABASE_SERVICE_ROLE_KEY), publishable/anon apikey.");
  process.exit(1);
}
if (!from || !to) {
  console.error("Usage: node scripts/backfill-market-chain.mjs <from YYYY-MM-DD> <to YYYY-MM-DD>");
  process.exit(1);
}

const url = `${base}/functions/v1/backfill-market-prices`;
const maxIterations = 500;
let iteration = 0;

while (iteration++ < maxIterations) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      apikey: anon,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, onlyMissing: true }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ iteration, ok: res.ok, ...body }));

  if (!res.ok) {
    console.error("Request failed");
    process.exit(1);
  }
  if (body.abortReason) {
    console.error("Stopped with abortReason; fix (e.g. rate limit) and rerun with same from/to.");
    process.exit(1);
  }
  if (body.completed) {
    process.exit(0);
  }
  if (typeof body.resumeFrom !== "string" || !body.resumeFrom) {
    console.error("Expected resumeFrom when completed is false");
    process.exit(1);
  }
  from = body.resumeFrom;
  await new Promise((r) => setTimeout(r, 3000));
}

console.error("Exceeded maxIterations; rerun with updated from.");
process.exit(1);
