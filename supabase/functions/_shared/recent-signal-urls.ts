/**
 * Recent Signal citation URLs for the same user — server-side dedup against
 * client-provided localStorage hints. Source: reflection_companions (companion_type signal) content.url.
 * (Denormalized reflections.signal_url was removed; Signal lives only in the join table.)
 */

export async function fetchRecentSignalCitationUrls(
  svcClient: any,
  userId: string,
  opts: { excludeReflectionId?: string | null; limit?: number },
): Promise<string[]> {
  const limit = Math.min(opts.limit ?? 20, 40);
  // Two-step: reflections no longer has signal_url; companion rows live on reflection_companions.
  let refQ = svcClient
    .from("reflections")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (opts.excludeReflectionId) {
    refQ = refQ.neq("id", opts.excludeReflectionId);
  }

  const { data: refRows, error: refErr } = await refQ;
  if (refErr || !refRows?.length) return [];

  const ids = (refRows as { id: string }[]).map((r) => r.id);
  const idOrder = new Map(ids.map((id, i) => [id, i]));

  const { data, error } = await svcClient
    .from("reflection_companions")
    .select("content, reflection_id")
    .eq("companion_type", "signal")
    .in("reflection_id", ids);

  if (error || !data?.length) return [];

  const rows = [...(data as { content?: { url?: string | null } | null; reflection_id: string }[])].sort(
    (a, b) => (idOrder.get(a.reflection_id) ?? 999) - (idOrder.get(b.reflection_id) ?? 999),
  );

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
