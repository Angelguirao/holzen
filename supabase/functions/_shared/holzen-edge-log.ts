/**
 * Edge / cron logging aligned with the SPA `holzen-console` idea: filter Supabase logs by **`holzen:`**.
 * Keep payloads small (counts, prefixes, flags) — no tokens, no full PII.
 *
 * **Parity with browser (`src/lib/holzen-console.ts`):**
 * - **Production:** set Edge secret **`HOLZEN_EDGE_LOG=0`** → verbose traces off (like prod without `holzen:debug`).
 *   You still get **`holzenEdgeRun`** (request + auth, and **always-on** one-line summaries where a worker emits them, e.g. `refresh-btc` **run complete**) and **`holzenEdgeError`** so cron health and failures are visible.
 * - **Staging / investigation:** leave **`HOLZEN_EDGE_LOG` unset** or set **`1`** → full **`holzenEdgeLog` / `holzenEdgeWarn`** flow
 *   (like **`import.meta.env.DEV`** or `localStorage holzen:debug=1` on the client).
 * - **Local `supabase functions serve`:** usually unset → flow logs on by default.
 *
 * - **Info / warn (`holzenEdgeLog`, `holzenEdgeWarn`):** gated by the above.
 * - **Errors (`holzenEdgeError`):** always emitted.
 *
 * Prefer **`log` from `withRequestLogging`** for handlers already wrapped there — it forwards to the log drain with `cid`. (Referral queue + digest/report crons were migrated off this module for that reason.)
 */

/** One tag per Edge surface — filter Supabase logs with `holzen:`. */
export type HolzenEdgeTag =
  | "volatility"
  | "volatility-email"
  | "volatility-push"
  | "refresh-btc"
  | "backfill-btc"
  | "seed-btc-history"
  | "fetch-feeds"
  | "pregenerate"
  | "night-reflection"
  | "weekly-digest"
  | "monthly-report"
  | "personalized-nudge"
  | "deliver-letters"
  | "reflection-insights"
  | "ai-cost-alert";

function tracesEnabled(): boolean {
  return Deno.env.get("HOLZEN_EDGE_LOG") !== "0";
}

function p(tag: HolzenEdgeTag): string {
  return `[holzen:${tag}]`;
}

export function holzenEdgeLog(
  tag: HolzenEdgeTag,
  msg: string,
  data?: Record<string, unknown>,
): void {
  if (!tracesEnabled()) return;
  const prefix = p(tag);
  if (data && Object.keys(data).length > 0) console.log(prefix, msg, data);
  else console.log(prefix, msg);
}

export function holzenEdgeWarn(
  tag: HolzenEdgeTag,
  msg: string,
  data?: Record<string, unknown>,
): void {
  if (!tracesEnabled()) return;
  const prefix = p(tag);
  if (data && Object.keys(data).length > 0) console.warn(prefix, msg, data);
  else console.warn(prefix, msg);
}

export function holzenEdgeError(tag: HolzenEdgeTag, msg: string, err?: unknown): void {
  const prefix = p(tag);
  if (err !== undefined && err !== "") console.error(prefix, msg, err);
  else console.error(prefix, msg);
}

/**
 * Always logged (ignores `HOLZEN_EDGE_LOG=0`) — request line + auth outcome so invocations are visible in Supabase. Some workers add a final line with a short **summary** payload (counts / HTTP / leg names).
 */
export function holzenEdgeRun(tag: HolzenEdgeTag, msg: string, data?: Record<string, unknown>): void {
  const prefix = p(tag);
  if (data && Object.keys(data).length > 0) console.log(prefix, msg, data);
  else console.log(prefix, msg);
}
