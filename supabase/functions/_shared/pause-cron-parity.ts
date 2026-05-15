/**
 * Cron-side fetches + orchestrator hints. Context suffix wording lives in `pause-context-suffix.ts`
 * (shared with the client via `@holzen-pause-context`).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { PauseContextFearGreed, PauseContextOnChain } from "./pause-context-suffix.ts";
import { enrichPauseContextWithMarketData } from "./pause-context-suffix.ts";
import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";

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
export async function fetchFearGreedSnapshot(incoming?: Request): Promise<FearGreedSnapshot | null> {
  try {
    const res = await fetch(
      "https://api.alternative.me/fng/?limit=1",
      fetchInitWithIncomingTrace(incoming, {}),
    );
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
export async function fetchOnChainSnapshot(incoming?: Request): Promise<OnChainSnapshot | null> {
  try {
    const base = fetchInitWithIncomingTrace(incoming, {});
    const [mempoolRes, feesRes, hashrateRes, tipRes] = await Promise.all([
      fetch("https://mempool.space/api/mempool", base).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("https://mempool.space/api/v1/fees/recommended", base).then((r) => (r.ok ? r.json() : null)).catch(
        () => null,
      ),
      fetch("https://mempool.space/api/v1/mining/hashrate/1d", base).then((r) => (r.ok ? r.json() : null)).catch(
        () => null,
      ),
      fetch("https://mempool.space/api/blocks/tip/height", base).then((r) => (r.ok ? r.text() : null)).catch(
        () => null,
      ),
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

type UserSignalPreferenceRow = {
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
  category: string;
};

type SignalCatalogRow = {
  id: string;
  name: string;
  type: string;
  url: string;
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

/**
 * Pause V2: derive orchestrator recency hints from recent pause_ai_artifacts
 * rows. Called from check-volatility after looking up the target user's
 * artifacts. Equivalent information to the legacy reflection-based helper
 * but tuned to the V2 schema shape.
 */
export async function recencyHintsFromPauseArtifacts(
  svcClient: SupabaseClient,
  userId: string,
): Promise<OrchestratorRecencyHints> {
  const recentSignalSources: string[] = [];
  const recentSignalTitles: string[] = [];
  const recentNudgeTopics: string[] = [];
  const recentGroundingSources: string[] = [];
  const recentHistoryTitles: string[] = [];
  const recentZoomOutTitles: string[] = [];

  try {
    const { data } = await svcClient
      .from("pause_ai_artifacts")
      .select("kind, content, created_at")
      .eq("user_id", userId)
      .in("kind", [
        "signal",
        "ground_nudge",
        "historical_insight",
        "zoom_out",
        "zoom_out_deep_time",
      ])
      .order("created_at", { ascending: false })
      .limit(60);

    for (const row of (data ?? []) as Array<{ kind: string; content: Record<string, unknown> }>) {
      const c = row.content ?? {};
      if (row.kind === "signal") {
        const src = typeof c.source === "string" ? c.source : null;
        const title = typeof c.title === "string" ? c.title : null;
        if (src) pushUnique(recentSignalSources, src, 5);
        if (title) pushUnique(recentSignalTitles, title, 5);
      } else if (row.kind === "ground_nudge") {
        const title = typeof c.title === "string" ? c.title : null;
        if (title) pushUnique(recentNudgeTopics, title, 5);
        const url = typeof c.url === "string" ? c.url : null;
        const h = hostnameFromReflectionUrl(url);
        if (h) pushUnique(recentGroundingSources, h, 5);
      } else if (row.kind === "historical_insight") {
        const t = typeof c.title === "string" ? c.title : null;
        if (t) pushUnique(recentHistoryTitles, t, 5);
      } else if (row.kind === "zoom_out" || row.kind === "zoom_out_deep_time") {
        const dt = (c as { deepTime?: { title?: string }; title?: string });
        const title = dt.deepTime?.title ?? dt.title ?? null;
        if (title) pushUnique(recentZoomOutTitles, title, 5);
      }
    }
  } catch {
    /* non-fatal */
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

/**
 * Pause V2: derive recent mood history + reflection/haiku pools from the
 * new tables. Replaces the legacy `v_reflection_with_companions` probe
 * used by check-volatility.
 */
export async function pauseRecencyInputs(
  svcClient: SupabaseClient,
  userId: string,
): Promise<{
  moodHistory: Array<{ mood: string; outcome: string | null; created_at: string | undefined }> | undefined;
  recentMessages: string[] | undefined;
  recentHaikus: string[] | undefined;
}> {
  let moodHistory: Array<{ mood: string; outcome: string | null; created_at: string | undefined }> | undefined;
  let recentMessages: string[] | undefined;
  let recentHaikus: string[] | undefined;

  try {
    // Mood history + outcomes join step events for the same instance.
    const { data: rows } = await svcClient
      .from("pause_step_events")
      .select("pause_instance_id, step_type, payload, created_at")
      .eq("user_id", userId)
      .in("step_type", ["initial_emotion_logged", "outcome_logged"])
      .order("created_at", { ascending: false })
      .limit(60);

    const byInstance = new Map<string, { mood?: string; outcome?: string; created_at?: string }>();
    for (const r of (rows ?? []) as Array<{ pause_instance_id: string; step_type: string; payload: Record<string, unknown>; created_at: string }>) {
      const e = byInstance.get(r.pause_instance_id) ?? {};
      if (r.step_type === "initial_emotion_logged" && typeof r.payload?.mood === "string") {
        e.mood = r.payload.mood as string;
        e.created_at = r.created_at;
      } else if (r.step_type === "outcome_logged" && typeof r.payload?.outcome === "string") {
        e.outcome = r.payload.outcome as string;
      }
      byInstance.set(r.pause_instance_id, e);
    }

    const entries = Array.from(byInstance.values()).filter((e) => e.mood);
    if (entries.length > 0) {
      moodHistory = entries
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .map((e) => ({ mood: e.mood!, outcome: e.outcome ?? null, created_at: e.created_at }));
    }

    const { data: artifacts } = await svcClient
      .from("pause_ai_artifacts")
      .select("kind, content, created_at")
      .eq("user_id", userId)
      .in("kind", ["reflection_text", "haiku"])
      .order("created_at", { ascending: false })
      .limit(20);
    const msgs: string[] = [];
    const haikus: string[] = [];
    for (const a of (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>) {
      if (a.kind === "reflection_text" && typeof a.content?.message === "string") {
        msgs.push(a.content.message as string);
      } else if (a.kind === "haiku" && typeof a.content?.haiku === "string") {
        haikus.push(a.content.haiku as string);
      }
    }
    if (msgs.length > 0) recentMessages = msgs.slice(0, 5);
    if (haikus.length > 0) recentHaikus = haikus.slice(0, 5);
  } catch {
    /* non-fatal */
  }

  return { moodHistory, recentMessages, recentHaikus };
}

/** Active signal catalog + custom URLs for Signal companion (same rules as use-companion-data). */
export async function fetchSignalSourcesForOrchestrate(
  svcClient: SupabaseClient,
  userId: string,
): Promise<Array<{ name: string; type: string; url: string }> | undefined> {
  try {
    const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
      svcClient.from("signal_sources").select("id, name, type, url, category").eq("category", "signal").eq("demoted_for_live", false),
      svcClient
        .from("user_signal_preferences")
        .select("source_id, custom_name, custom_url, custom_type, active, category")
        .eq("user_id", userId)
        .eq("category", "signal"),
    ]);
    const typedUserPrefs = (userPrefs ?? []) as UserSignalPreferenceRow[];
    const prefsMap = new Map<string, UserSignalPreferenceRow>(
      typedUserPrefs
        .filter((p) => typeof p.source_id === "string" && p.source_id.length > 0)
        .map((p) => [p.source_id as string, p] as const),
    );
    const catalogRows = (catalog ?? []) as SignalCatalogRow[];
    const catalogActive = catalogRows
      .filter((s) => {
        const pref = prefsMap.get(s.id);
        return pref?.active ?? true;
      })
      .map((s) => ({ name: s.name, type: s.type, url: s.url }));
    const customActive = typedUserPrefs
      .filter((p) => !p.source_id && p.custom_name && p.active)
      .map((p) => ({
        name: p.custom_name as string,
        type: p.custom_type || "blog",
        url: p.custom_url ?? "",
      }));
    const sources = [...catalogActive, ...customActive];
    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}

/** Active grounding catalog + custom URLs for Grounding companion (same merge rules as signal). */
export async function fetchGroundingSourcesForOrchestrate(
  svcClient: SupabaseClient,
  userId: string,
): Promise<Array<{ name: string; type: string; url: string }> | undefined> {
  try {
    const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
      svcClient.from("signal_sources").select("id, name, type, url, category").eq("category", "grounding").eq("demoted_for_live", false),
      svcClient
        .from("user_signal_preferences")
        .select("source_id, custom_name, custom_url, custom_type, active, category")
        .eq("user_id", userId)
        .eq("category", "grounding"),
    ]);
    const typedUserPrefs = (userPrefs ?? []) as UserSignalPreferenceRow[];
    const prefsMap = new Map<string, UserSignalPreferenceRow>(
      typedUserPrefs
        .filter((p) => typeof p.source_id === "string" && p.source_id.length > 0)
        .map((p) => [p.source_id as string, p] as const),
    );
    const catalogRows = (catalog ?? []) as SignalCatalogRow[];
    const catalogActive = catalogRows
      .filter((s) => {
        const pref = prefsMap.get(s.id);
        return pref?.active ?? true;
      })
      .map((s) => ({ name: s.name, type: s.type, url: s.url }));
    const customActive = typedUserPrefs
      .filter((p) => !p.source_id && p.custom_name && p.active)
      .map((p) => ({
        name: p.custom_name as string,
        type: p.custom_type || "blog",
        url: p.custom_url ?? "",
      }));
    const sources = [...catalogActive, ...customActive];
    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}
