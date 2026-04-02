/**
 * Recent Signal citation URLs for the same user — server-side dedup against
 * client-provided localStorage hints. Source: reflections.signal_url (denormalized).
 */

export async function fetchRecentSignalCitationUrls(
  svcClient: any,
  userId: string,
  opts: { excludeReflectionId?: string | null; limit?: number },
): Promise<string[]> {
  const limit = Math.min(opts.limit ?? 20, 40);
  let q = svcClient
    .from("reflections")
    .select("signal_url")
    .eq("user_id", userId)
    .not("signal_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit + 15);

  if (opts.excludeReflectionId) {
    q = q.neq("id", opts.excludeReflectionId);
  }

  const { data, error } = await q;
  if (error || !data?.length) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of data as { signal_url: string | null }[]) {
    const u = row.signal_url?.trim();
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
