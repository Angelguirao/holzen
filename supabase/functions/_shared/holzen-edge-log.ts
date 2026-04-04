/**
 * Edge / cron logging aligned with the SPA `holzen-console` idea: filter Supabase logs by **`holzen:`**.
 * Keep payloads small (counts, prefixes, flags) — no tokens, no full PII.
 *
 * - **Info / warn:** omitted when `HOLZEN_EDGE_LOG=0` (reduce noise in high-volume prod).
 * - **Errors:** always emitted (so failures are never silent).
 */

/** One tag per Edge surface — filter Supabase logs with `holzen:`. */
export type HolzenEdgeTag =
  | "volatility"
  | "volatility-email"
  | "volatility-push"
  | "refresh-btc"
  | "fetch-feeds"
  | "pregenerate"
  | "followups"
  | "night-reflection"
  | "weekly-digest"
  | "monthly-report"
  | "personalized-nudge"
  | "deliver-letters"
  | "reflection-insights";

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
 * Always logged (ignores `HOLZEN_EDGE_LOG=0`) — request line + auth outcome so invocations are visible in Supabase.
 */
export function holzenEdgeRun(tag: HolzenEdgeTag, msg: string, data?: Record<string, unknown>): void {
  const prefix = p(tag);
  if (data && Object.keys(data).length > 0) console.log(prefix, msg, data);
  else console.log(prefix, msg);
}
