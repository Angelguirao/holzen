/**
 * Recent Signal citation URLs for the same user — server-side dedup against
 * client-provided localStorage hints. Source: pause_ai_artifacts (kind='signal') content.url.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export async function fetchRecentSignalCitationUrls(
  svcClient: SupabaseClient,
  userId: string,
  opts: { excludePauseInstanceId?: string | null; limit?: number },
): Promise<string[]> {
  const limit = Math.min(opts.limit ?? 20, 40);

  let q = svcClient
    .from("pause_ai_artifacts")
    .select("content, pause_instance_id, created_at")
    .eq("user_id", userId)
    .eq("kind", "signal")
    .order("created_at", { ascending: false })
    .limit(80);

  if (opts.excludePauseInstanceId) {
    q = q.neq("pause_instance_id", opts.excludePauseInstanceId);
  }

  const { data, error } = await q;
  if (error || !data?.length) return [];

  const rows = data as Array<{ content?: { url?: string | null } | null }>;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const u = typeof row.content?.url === "string" ? row.content.url.trim() : "";
    if (!u || !u.startsWith("http")) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= limit) break;
  }
  return out;
}

/** Merge DB + client recent Signal URLs; DB rows first, dedupe, cap length for prompts. */
export function mergeRecentSignalUrls(dbUrls: string[], clientUrls: string[], cap: number): string[] | undefined {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [...dbUrls, ...clientUrls]) {
    const t = typeof u === "string" ? u.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out.length > 0 ? out : undefined;
}

/** When both YouTube and non-YouTube citations exist, prefer ordering non-YouTube first for structuring. */
export function preferNonYoutubeCitationsFirst(urls: string[]): string[] {
  const yt: string[] = [];
  const rest: string[] = [];
  for (const u of urls) {
    if (typeof u !== "string" || !u.length) continue;
    if (/youtube\.com|youtu\.be/i.test(u)) yt.push(u);
    else rest.push(u);
  }
  return rest.length > 0 && yt.length > 0 ? [...rest, ...yt] : urls;
}
