/**
 * Cron-side fetches + orchestrator hints. Context suffix wording lives in `pause-context-suffix.ts`
 * (shared with the client via `@holzen-pause-context`).
 */

import type { PauseContextFearGreed, PauseContextOnChain } from "./pause-context-suffix.ts";
import { enrichPauseContextWithMarketData } from "./pause-context-suffix.ts";

export type FearGreedSnapshot = PauseContextFearGreed;
export type OnChainSnapshot = PauseContextOnChain;

/** Re-export for `check-volatility` — identical to `enrichPauseContextWithMarketData` in `use-holzen`. */
export function enrichAutomaticPauseContext(
  baseCtx: string,
  fearGreed: FearGreedSnapshot | null,
  onChain: OnChainSnapshot | null,
): string {
  return enrichPauseContextWithMarketData(baseCtx, fearGreed, onChain);
}

/** One shared Fear & Greed fetch per cron run (same index for all users that tick). */
export async function fetchFearGreedSnapshot(): Promise<FearGreedSnapshot | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;
    const value = parseInt(entry.value, 10);
    if (Number.isNaN(value)) return null;
    return { value, label: String(entry.value_classification ?? "Unknown") };
  } catch {
    return null;
  }
}

/** One shared mempool.space round-trip per cron run (same parsing as `fetchOnChainData` in `src/lib/btc.ts`). */
export async function fetchOnChainSnapshot(): Promise<OnChainSnapshot | null> {
  try {
    const [mempoolRes, feesRes, hashrateRes, tipRes] = await Promise.all([
      fetch("https://mempool.space/api/mempool").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("https://mempool.space/api/v1/fees/recommended").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("https://mempool.space/api/v1/mining/hashrate/1d").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("https://mempool.space/api/blocks/tip/height").then((r) => (r.ok ? r.text() : null)).catch(() => null),
    ]);

    const result: OnChainSnapshot = {};
    if (mempoolRes) result.mempoolSize = mempoolRes.count;
    if (feesRes) {
      result.fastestFee = feesRes.fastestFee;
      result.medianFee = feesRes.halfHourFee;
    }
    if (hashrateRes?.currentHashrate) {
      const eh = hashrateRes.currentHashrate / 1e18;
      result.hashrate = `${eh.toFixed(1)} EH/s`;
    }
    if (tipRes) result.blockHeight = parseInt(tipRes, 10);
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export interface OrchestratorRecencyHints {
  recentSignalSources: string[];
  recentSignalTitles: string[];
  recentNudgeTopics: string[];
  /** Hostnames from past grounding URLs — same role as `recentSignalSources` for dedup. */
  recentGroundingSources: string[];
  recentHistoryTitles: string[];
  recentZoomOutTitles: string[];
}

type ReflectionRow = {
  signal_title?: string | null;
  signal_source?: string | null;
  grounding_title?: string | null;
  grounding_url?: string | null;
  zoom_out_data?: unknown;
  history_insight_data?: unknown;
};

function hostnameFromReflectionUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const h = u.hostname.replace(/^www\./, "");
    return h || null;
  } catch {
    return null;
  }
}

function pushUnique(cap: string[], v: string, max: number) {
  if (!v || cap.includes(v) || cap.length >= max) return;
  cap.push(v);
}

/** Derive orchestrator recency hints from recent reflection rows (newest first). */
export function recencyHintsFromReflectionRows(rows: ReflectionRow[]): OrchestratorRecencyHints {
  const recentSignalSources: string[] = [];
  const recentSignalTitles: string[] = [];
  const recentNudgeTopics: string[] = [];
  const recentGroundingSources: string[] = [];
  const recentHistoryTitles: string[] = [];
  const recentZoomOutTitles: string[] = [];

  for (const r of rows) {
    if (r.signal_source) pushUnique(recentSignalSources, r.signal_source, 5);
    if (r.signal_title) pushUnique(recentSignalTitles, r.signal_title, 5);
    if (r.grounding_title) pushUnique(recentNudgeTopics, r.grounding_title, 5);
    const gh = hostnameFromReflectionUrl(r.grounding_url);
    if (gh) pushUnique(recentGroundingSources, gh, 5);

    const hi = r.history_insight_data;
    if (hi && typeof hi === "object" && "title" in hi) {
      const t = (hi as { title?: string }).title;
      if (t) pushUnique(recentHistoryTitles, t, 5);
    }

    const zo = r.zoom_out_data;
    if (zo && typeof zo === "object" && zo !== null && "deepTime" in zo) {
      const dt = (zo as { deepTime?: { title?: string } }).deepTime;
      if (dt?.title) pushUnique(recentZoomOutTitles, dt.title, 5);
    }
  }

  return {
    recentSignalSources,
    recentSignalTitles,
    recentNudgeTopics,
    recentGroundingSources,
    recentHistoryTitles,
    recentZoomOutTitles,
  };
}

/** Active signal catalog + custom URLs for Signal companion (same rules as use-companion-data). */
export async function fetchSignalSourcesForOrchestrate(
  svcClient: any,
  userId: string,
): Promise<Array<{ name: string; type: string; url: string }> | undefined> {
  try {
    const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
      svcClient.from("signal_sources").select("id, name, type, url, category").eq("category", "signal"),
      svcClient
        .from("user_signal_preferences")
        .select("source_id, custom_name, custom_url, custom_type, active, category")
        .eq("user_id", userId)
        .eq("category", "signal"),
    ]);
    const prefsMap = new Map((userPrefs ?? []).map((p: any) => [p.source_id, p]));
    const catalogActive = (catalog ?? [])
      .filter((s: any) => {
        const pref = prefsMap.get(s.id);
        return pref ? pref.active : true;
      })
      .map((s: any) => ({ name: s.name, type: s.type, url: s.url }));
    const customActive = (userPrefs ?? [])
      .filter((p: any) => !p.source_id && p.custom_name && p.active)
      .map((p: any) => ({ name: p.custom_name, type: p.custom_type || "blog", url: p.custom_url }));
    const sources = [...catalogActive, ...customActive];
    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}

/** Active grounding catalog + custom URLs for Grounding companion (same merge rules as signal). */
export async function fetchGroundingSourcesForOrchestrate(
  svcClient: any,
  userId: string,
): Promise<Array<{ name: string; type: string; url: string }> | undefined> {
  try {
    const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
      svcClient.from("signal_sources").select("id, name, type, url, category").eq("category", "grounding"),
      svcClient
        .from("user_signal_preferences")
        .select("source_id, custom_name, custom_url, custom_type, active, category")
        .eq("user_id", userId)
        .eq("category", "grounding"),
    ]);
    const prefsMap = new Map((userPrefs ?? []).map((p: any) => [p.source_id, p]));
    const catalogActive = (catalog ?? [])
      .filter((s: any) => {
        const pref = prefsMap.get(s.id);
        return pref ? pref.active : true;
      })
      .map((s: any) => ({ name: s.name, type: s.type, url: s.url }));
    const customActive = (userPrefs ?? [])
      .filter((p: any) => !p.source_id && p.custom_name && p.active)
      .map((p: any) => ({ name: p.custom_name, type: p.custom_type || "blog", url: p.custom_url }));
    const sources = [...catalogActive, ...customActive];
    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}
