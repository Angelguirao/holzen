/**
 * Helpers so automatic pause (check-volatility) matches manual pause inputs:
 * same market-sentiment line in context, signal sources, and DB-derived recency hints
 * for companion-orchestrate (mirrors use-holzen / use-companion-data behavior).
 */

export interface FearGreedSnapshot {
  value: number;
  label: string;
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

/** Same suffix as `use-holzen.ts` / `fetchBtcData` context string. */
export function appendFearGreedToContext(ctx: string, fg: FearGreedSnapshot | null): string {
  if (!fg) return ctx;
  return `${ctx} Market sentiment: ${fg.label} (${fg.value}/100).`;
}

export interface OrchestratorRecencyHints {
  recentSignalSources: string[];
  recentSignalTitles: string[];
  recentNudgeTopics: string[];
  recentHistoryTitles: string[];
  recentZoomOutTitles: string[];
}

type ReflectionRow = {
  signal_title?: string | null;
  signal_source?: string | null;
  grounding_title?: string | null;
  zoom_out_data?: unknown;
  history_insight_data?: unknown;
};

function pushUnique(cap: string[], v: string, max: number) {
  if (!v || cap.includes(v) || cap.length >= max) return;
  cap.push(v);
}

/** Derive orchestrator recency hints from recent reflection rows (newest first). */
export function recencyHintsFromReflectionRows(rows: ReflectionRow[]): OrchestratorRecencyHints {
  const recentSignalSources: string[] = [];
  const recentSignalTitles: string[] = [];
  const recentNudgeTopics: string[] = [];
  const recentHistoryTitles: string[] = [];
  const recentZoomOutTitles: string[] = [];

  for (const r of rows) {
    if (r.signal_source) pushUnique(recentSignalSources, r.signal_source, 5);
    if (r.signal_title) pushUnique(recentSignalTitles, r.signal_title, 5);
    if (r.grounding_title) pushUnique(recentNudgeTopics, r.grounding_title, 5);

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
