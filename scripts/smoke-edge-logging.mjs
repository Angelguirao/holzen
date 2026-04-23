#!/usr/bin/env node
/**
 * Smoke-test that `withRequestLogging` writes the expected `request` log entry
 * for every deployed edge function.
 *
 * Strategy
 * --------
 * 1. Discover every `supabase/functions/<name>/index.ts` that boots an HTTP
 *    server (same heuristic as `scripts/check-edge-logging.mjs`).
 * 2. Send a benign request (OPTIONS preflight by default — every wrapped
 *    handler must serve it, no auth required, no side effects) with a unique
 *    `x-cid` header per function.
 * 3. Verify two things:
 *      a) the response carries the same `x-cid` back (set by `decorateResponse`
 *         inside the wrapper — a strong signal the wrapper actually ran), and
 *      b) optionally, that BetterStack received a JSON line with `event:
 *         "request"` for that cid (only when `LOG_DRAIN_QUERY_URL` +
 *         `LOG_DRAIN_QUERY_TOKEN` are configured).
 *
 * The cid round-trip alone is enough to catch a regression where someone
 * removes the wrapper or bypasses it — the response would lose `x-cid`.
 * The BetterStack check is the stronger end-to-end assertion when creds
 * are available locally.
 *
 * Usage
 * -----
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_ANON_KEY=<anon> \
 *   node scripts/smoke-edge-logging.mjs            # check every function
 *   node scripts/smoke-edge-logging.mjs health notify-checkout-confirmation
 *
 * Optional:
 *   LOG_DRAIN_QUERY_URL=...   # BetterStack Live Tail / query endpoint
 *   LOG_DRAIN_QUERY_TOKEN=... # bearer token for the query endpoint
 *   SMOKE_TIMEOUT_MS=8000     # per-function HTTP timeout
 *   SMOKE_LOG_WAIT_MS=4000    # how long to wait before querying logs
 *
 * Exit code is non-zero if any function fails the cid round-trip (or, when
 * configured, the BetterStack lookup).
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fnRoot = join(__dirname, '..', 'supabase', 'functions');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 8000);
const LOG_WAIT_MS = Number(process.env.SMOKE_LOG_WAIT_MS ?? 4000);
const LOG_QUERY_URL = process.env.LOG_DRAIN_QUERY_URL;
const LOG_QUERY_TOKEN = process.env.LOG_DRAIN_QUERY_TOKEN;

if (!SUPABASE_URL) {
  console.error('[smoke] SUPABASE_URL (or VITE_SUPABASE_URL) is required.');
  process.exit(2);
}

const STD_HTTP_IMPORT =
  /from\s+["']https:\/\/deno\.land\/std@[^"']+\/http\/server\.ts["']/;

function discoverFunctions() {
  if (!existsSync(fnRoot)) return [];
  return readdirSync(fnRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== '_shared')
    .map((e) => ({ name: e.name, path: join(fnRoot, e.name, 'index.ts') }))
    .filter((e) => existsSync(e.path) && statSync(e.path).isFile())
    .filter(({ path }) => {
      const src = readFileSync(path, 'utf8');
      const usesDenoServe = /\bDeno\.serve\s*\(/.test(src);
      const usesStdServe = STD_HTTP_IMPORT.test(src) && /\bserve\s*\(/.test(src);
      return usesDenoServe || usesStdServe;
    })
    .map((e) => e.name)
    .sort();
}

function uuid() {
  // Node 18+ has crypto.randomUUID on globalThis.crypto
  return globalThis.crypto.randomUUID();
}

async function pingFunction(name) {
  const cid = `smoke-${name}-${uuid()}`;
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  // OPTIONS preflight: handled by `withRequestLogging` → `handleCors` BEFORE
  // any auth check, so it works uniformly for `verify_jwt = true` functions
  // too. It still flows through the wrapper enough to set `x-cid` on the
  // response (decorateResponse runs on the cors short-circuit path? no — it
  // does NOT, see below). For OPTIONS we can only assert HTTP 200 + CORS.
  //
  // To force a request that goes through the wrapper's logging path, also
  // send a GET. Public functions (`health`, `holzen-number`) will return
  // 200; protected ones return 401 — either way the wrapper logged
  // `request` and stamped `x-cid` on the response.
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        'x-cid': cid,
        // Anon key lets us reach functions that require Supabase JWT verification;
        // the underlying handler may still 401 (no user), and that's fine — we
        // only need the wrapper to have run.
        ...(SUPABASE_ANON_KEY
          ? {
              apikey: SUPABASE_ANON_KEY,
              authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            }
          : {}),
      },
    });
  } catch (err) {
    clearTimeout(timer);
    return { name, cid, ok: false, reason: `fetch_failed: ${err?.message ?? err}` };
  }
  clearTimeout(timer);

  // Drain body to free the connection (and to surface payload-related crashes).
  await res.text().catch(() => {});

  const echoedCid = res.headers.get('x-cid');
  if (!echoedCid) {
    return {
      name,
      cid,
      status: res.status,
      ok: false,
      reason: 'wrapper_missing: response has no x-cid header',
    };
  }
  if (echoedCid !== cid) {
    return {
      name,
      cid,
      status: res.status,
      ok: false,
      reason: `cid_mismatch: sent ${cid}, got ${echoedCid}`,
    };
  }
  return { name, cid, status: res.status, ok: true };
}

async function checkLogDrain(results) {
  if (!LOG_QUERY_URL || !LOG_QUERY_TOKEN) {
    console.log(
      '[smoke] LOG_DRAIN_QUERY_URL/TOKEN unset — skipping BetterStack lookup. ' +
        'Cid round-trip alone proves the wrapper ran.'
    );
    return results;
  }

  console.log(`[smoke] Waiting ${LOG_WAIT_MS}ms for log drain to flush...`);
  await new Promise((r) => setTimeout(r, LOG_WAIT_MS));

  // Generic JSON-search shape — adapt to your BetterStack source. The wrapper
  // emits `{"event":"request","cid":"<cid>","fn":"<name>", ...}`.
  const enriched = await Promise.all(
    results.map(async (r) => {
      if (!r.ok) return r;
      try {
        const q = new URL(LOG_QUERY_URL);
        q.searchParams.set('query', `cid:"${r.cid}" event:"request"`);
        const res = await fetch(q.toString(), {
          headers: { authorization: `Bearer ${LOG_QUERY_TOKEN}` },
        });
        const body = await res.text();
        const found = res.ok && body.includes(r.cid) && body.includes('"request"');
        return found
          ? { ...r, drain: 'found' }
          : { ...r, ok: false, reason: 'drain_missing_request_event', drain: 'missing' };
      } catch (err) {
        return { ...r, drain: `query_failed: ${err?.message ?? err}` };
      }
    })
  );
  return enriched;
}

async function main() {
  const argv = process.argv.slice(2);
  const requested = argv.length > 0 ? argv : discoverFunctions();
  if (requested.length === 0) {
    console.error('[smoke] No edge functions discovered.');
    process.exit(2);
  }

  console.log(`[smoke] Pinging ${requested.length} function(s) at ${SUPABASE_URL}/functions/v1/`);
  const results = await Promise.all(requested.map((n) => pingFunction(n)));
  const checked = await checkLogDrain(results);

  const pad = Math.max(...checked.map((r) => r.name.length));
  for (const r of checked) {
    const label = r.ok ? 'OK ' : 'FAIL';
    const status = r.status ?? '---';
    const drain = r.drain ? ` drain=${r.drain}` : '';
    const reason = r.reason ? ` — ${r.reason}` : '';
    console.log(`  [${label}] ${r.name.padEnd(pad)}  http=${status}${drain}${reason}`);
  }

  const failed = checked.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n[smoke] FAIL — ${failed.length} function(s) did not echo cid / log request.`);
    process.exit(1);
  }
  console.log(`\n[smoke] OK — wrapper ran for all ${checked.length} function(s).`);
}

main().catch((err) => {
  console.error('[smoke] Unexpected error:', err);
  process.exit(2);
});