import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { unknownErrorForLog } from "../_shared/log-unknown-error.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Bulk-seed `btc_price_cache` with daily closing BTC-USD prices from
 * **CryptoCompare**'s free `histoday` endpoint.
 *
 * **Why a separate function from `backfill-btc-prices`?** Since mid-2024
 * CoinGecko's demo tier serves historical `/coins/bitcoin/history` only for
 * the last ~365 days and returns 401 for older dates. That made Zoom Out's
 * 10-year anniversary strip impossible to fill on the free tier via
 * `refresh-btc-prices` or `backfill-btc-prices`. CryptoCompare's free
 * `histoday` endpoint has no such restriction — it serves daily OHLC back to
 * BTC's earliest listing with no auth required and a generous quota (~100k
 * calls/month free). Used **once** after initial deployment (or after a DB
 * restore) to populate historical daily rows; afterwards the cron
 * `refresh-btc-prices` keeps today's row current and the immutable historical
 * rows are never re-fetched.
 *
 * **Auth:** service-role JWT or `CRON_SECRET` (same as other cron workers).
 *
 * **Body (JSON, all optional):**
 * - `from`: inclusive `YYYY-MM-DD`; default `"2014-09-17"` (earliest date in
 *   common free daily datasets; pre-2014 BTC had no liquid USD spot market).
 * - `to`: inclusive `YYYY-MM-DD`; default today UTC.
 * - `onlyMissing` (default `true`): skip dates already present in the table.
 * - `dryRun` (default `false`): fetch + parse but don't upsert.
 * - `batchLimit` (default `2000`, max `2000`): CryptoCompare's per-call limit.
 *
 * **Strategy:** walks the range backwards in batches of `batchLimit`, using
 * CryptoCompare's `toTs` parameter to chain pages. Stops when the earliest
 * returned timestamp is <= `from` or no rows come back. A single invocation
 * typically covers ~10+ years in 2-3 network calls.
 */

/** CryptoCompare's documented hard cap for `histoday.limit`. */
const CRYPTOCOMPARE_MAX_LIMIT = 2000;
/** Spacing between CryptoCompare pages — free tier is generous; this is polite. */
const PAGE_GAP_MS = 800;
/** Upper bound: CryptoCompare daily data starts 2010-07-17. Refuse absurd inputs. */
const EARLIEST_ALLOWED = "2010-01-01";

interface CryptoCompareDayRow {
  time: number;
  close: number;
}

interface CryptoCompareResponse {
  Response?: string;
  Message?: string;
  Data?: { Data?: CryptoCompareDayRow[] };
}

function parseDateKey(s: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, mo, d] = s.split("-").map(Number);
  const ms = Date.UTC(y, mo - 1, d);
  if (!Number.isFinite(ms)) return null;
  const roundTrip = new Date(ms).toISOString().slice(0, 10);
  if (roundTrip !== s) return null;
  return ms;
}

function toDateKey(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

async function fetchCryptoCompareHistoDay(
  toTsSec: number,
  limit: number,
  incoming?: Request,
): Promise<{ rows: CryptoCompareDayRow[]; rateLimited: boolean; httpStatus: number }> {
  const url =
    `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${limit}&toTs=${toTsSec}`;
  const apiKey = Deno.env.get("CRYPTOCOMPARE_API_KEY");
  const headers: HeadersInit = apiKey ? { authorization: `Apikey ${apiKey}` } : {};
  let res: Response;
  try {
    res = await fetch(
      url,
      fetchInitWithIncomingTrace(incoming, {
        headers,
        signal: AbortSignal.timeout(15000),
      }),
    );
  } catch {
    return { rows: [], rateLimited: false, httpStatus: 0 };
  }
  if (res.status === 429) return { rows: [], rateLimited: true, httpStatus: 429 };
  if (!res.ok) return { rows: [], rateLimited: false, httpStatus: res.status };
  let json: CryptoCompareResponse;
  try {
    json = (await res.json()) as CryptoCompareResponse;
  } catch {
    return { rows: [], rateLimited: false, httpStatus: res.status };
  }
  if (json.Response !== "Success") {
    return { rows: [], rateLimited: false, httpStatus: res.status };
  }
  const rows = (json.Data?.Data ?? []).filter(
    (r): r is CryptoCompareDayRow =>
      typeof r?.time === "number" &&
      typeof r?.close === "number" &&
      Number.isFinite(r.close) &&
      r.close > 0,
  );
  return { rows, rateLimited: false, httpStatus: res.status };
}

serve(
  withRequestLogging("seed-btc-history", async ({ req, log }) => {
  const t0 = Date.now();

  try {
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      log.warn("seed_btc_history_phase", {
        holzen_event: "seed_btc_history_cron",
        phase: "service_auth_rejected",
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log("seed_btc_history_phase", {
      holzen_event: "seed_btc_history_cron",
      phase: "service_auth_ok",
    });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST required" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse((await req.text()) || "{}") as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromRaw = typeof body.from === "string" ? body.from : "2014-09-17";
    const toRaw =
      typeof body.to === "string" ? body.to : new Date().toISOString().slice(0, 10);
    const onlyMissing = body.onlyMissing !== false;
    const dryRun = body.dryRun === true;
    const batchLimit =
      typeof body.batchLimit === "number" && body.batchLimit > 0
        ? Math.min(CRYPTOCOMPARE_MAX_LIMIT, Math.floor(body.batchLimit))
        : CRYPTOCOMPARE_MAX_LIMIT;

    const fromMs = parseDateKey(fromRaw);
    const toMs = parseDateKey(toRaw);
    const earliestMs = parseDateKey(EARLIEST_ALLOWED)!;
    if (fromMs === null || toMs === null) {
      return new Response(JSON.stringify({ error: "from/to must be YYYY-MM-DD" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fromMs < earliestMs) {
      return new Response(
        JSON.stringify({ error: `from must be >= ${EARLIEST_ALLOWED}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (fromMs > toMs) {
      return new Response(JSON.stringify({ error: "from must be <= to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
      { auth: { persistSession: false } },
    );

    // Optional: pre-read existing rows so we can skip upserts for them.
    let existingDates = new Set<string>();
    if (onlyMissing) {
      const { data: existing, error: selErr } = await supabase
        .from("btc_price_cache")
        .select("date")
        .gte("date", fromRaw)
        .lte("date", toRaw);
      if (selErr) {
        log.error("seed_btc_history_select", {
          holzen_event: "seed_btc_history_cron",
          phase: "select_existing_failed",
          ...unknownErrorForLog(selErr),
        });
        return new Response(
          JSON.stringify({ error: "Failed to read existing cache rows" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      existingDates = new Set((existing ?? []).map((r: { date: string }) => r.date));
    }

    const fetchedAt = new Date().toISOString();
    const allInserts: { date: string; price: number; fetched_at: string }[] = [];
    let pagesFetched = 0;
    let rowsReceived = 0;
    let rateLimited = false;
    let lastHttpError: number | null = null;

    // Walk backwards from `toTs` toward `fromMs`. Each page returns the day at
    // `toTs` plus `limit` prior days (so `limit + 1` rows). The earliest row's
    // time becomes the anchor for the next page's `toTs - 1 day`.
    let cursorTsSec = Math.floor(toMs / 1000);

    while (cursorTsSec >= Math.floor(fromMs / 1000)) {
      if (pagesFetched > 0) await new Promise((r) => setTimeout(r, PAGE_GAP_MS));
      const { rows, rateLimited: rl, httpStatus } = await fetchCryptoCompareHistoDay(
        cursorTsSec,
        batchLimit,
        req,
      );
      pagesFetched++;
      if (rl) {
        rateLimited = true;
        log.warn("seed_btc_history_cryptocompare", {
          holzen_event: "seed_btc_history_cron",
          phase: "cryptocompare_rate_limited",
          page: pagesFetched,
        });
        break;
      }
      if (rows.length === 0) {
        lastHttpError = httpStatus;
        log.warn("seed_btc_history_cryptocompare", {
          holzen_event: "seed_btc_history_cron",
          phase: "cryptocompare_empty_or_non_success",
          page: pagesFetched,
          http_status: httpStatus,
        });
        break;
      }
      rowsReceived += rows.length;

      // Build inserts for rows inside the requested window and not already cached
      // (when onlyMissing=true). CryptoCompare sometimes returns zero-close rows
      // for days before the coin existed — those are filtered in the fetcher.
      for (const r of rows) {
        const rMs = r.time * 1000;
        if (rMs < fromMs || rMs > toMs) continue;
        const dateKey = toDateKey(r.time);
        if (onlyMissing && existingDates.has(dateKey)) continue;
        allInserts.push({ date: dateKey, price: Math.round(r.close), fetched_at: fetchedAt });
      }

      // Chain: next page ends one day before this page's earliest row.
      const earliestRowTs = rows.reduce((m, r) => (r.time < m ? r.time : m), rows[0].time);
      if (earliestRowTs <= Math.floor(fromMs / 1000)) break;
      cursorTsSec = earliestRowTs - 86400;

      // Hard safety: never more than ~20 pages per invocation (20 * 2001 rows
      // covers ~110 years of daily data — generous headroom, bounded wall-clock).
      if (pagesFetched >= 20) {
        log.warn("seed_btc_history_pages", {
          holzen_event: "seed_btc_history_cron",
          phase: "page_cap_reached",
          pages_fetched: pagesFetched,
        });
        break;
      }
    }

    // De-dupe inserts by date (CryptoCompare pages overlap by one day on the boundary).
    const byDate = new Map<string, { date: string; price: number; fetched_at: string }>();
    for (const ins of allInserts) byDate.set(ins.date, ins);
    const finalInserts = Array.from(byDate.values());

    let upserted = 0;
    if (!dryRun && finalInserts.length > 0) {
      // Chunk the upsert — Postgres / PostgREST handle big batches but 500-ish
      // is a safe ceiling that keeps error messages focused if something trips.
      const CHUNK = 500;
      for (let i = 0; i < finalInserts.length; i += CHUNK) {
        const chunk = finalInserts.slice(i, i + CHUNK);
        const { error: upErr } = await supabase.from("btc_price_cache").upsert(chunk);
        if (upErr) {
          log.error("seed_btc_history_upsert", {
            holzen_event: "seed_btc_history_cron",
            phase: "upsert_failed",
            ...unknownErrorForLog(upErr),
          });
          return new Response(
            JSON.stringify({
              error: "Upsert failed",
              detail: String(upErr),
              upsertedBeforeFailure: upserted,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        upserted += chunk.length;
      }
    }

    const summary = dryRun
      ? `seed dryRun: ${finalInserts.length} rows ready, ${pagesFetched} pages, ${rowsReceived} received`
      : `seed: upserted ${upserted} rows, ${pagesFetched} pages, ${rowsReceived} received` +
        (rateLimited ? " (rate limited)" : "") +
        (lastHttpError ? ` (last http=${lastHttpError})` : "");
    log("seed_btc_history_complete", {
      holzen_event: "seed_btc_history_cron",
      phase: "run_complete",
      ms: Date.now() - t0,
      summary,
    });

    return new Response(
      JSON.stringify({
        success: !rateLimited && lastHttpError === null,
        from: fromRaw,
        to: toRaw,
        onlyMissing,
        dryRun,
        batchLimit,
        pagesFetched,
        rowsReceived,
        rowsReady: finalInserts.length,
        rowsUpserted: upserted,
        rateLimited,
        lastHttpError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    log.error("seed_btc_history_uncaught", {
      holzen_event: "seed_btc_history_cron",
      phase: "uncaught",
      ...unknownErrorForLog(e),
    });
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
