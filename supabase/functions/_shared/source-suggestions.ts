/**
 * Enqueue a catalog source candidate from a successful live Signal/Grounding generation.
 * Human admins approve into signal_sources — never auto-insert from here.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

function normalizeDedupeKey(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = (u.pathname.replace(/\/$/, "") || "/").toLowerCase();
    return `${host}${path}`;
  } catch {
    return null;
  }
}

/** Skip URLs that make poor catalog entries or are search aggregators */
function shouldSkipSuggestionUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return true;
  if (lower.includes("scholar.google.")) return true;
  if (lower.includes("google.com/search")) return true;
  if (lower.includes("bing.com/search")) return true;
  if (lower.includes("duckduckgo.com")) return true;
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return true;
  return false;
}

export async function enqueueCatalogSourceSuggestion(
  svcClient: SupabaseClient,
  opts: {
    category: "signal" | "grounding";
    /** Display name (author or publication) */
    name: string;
    url: string;
    pauseInstanceId?: string | null;
  },
): Promise<void> {
  const name = opts.name?.trim();
  const url = opts.url?.trim();
  if (!name || !url) return;
  if (shouldSkipSuggestionUrl(url)) return;

  const dedupeKey = normalizeDedupeKey(url);
  if (!dedupeKey) return;

  try {
    const { data: pending } = await svcClient
      .from("signal_source_suggestions")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) return;

    const { data: catalog } = await svcClient
      .from("signal_sources")
      .select("id, url")
      .eq("category", opts.category);
    for (const row of catalog ?? []) {
      const rurl = (row as { url: string | null }).url;
      if (!rurl) continue;
      const k = normalizeDedupeKey(rurl);
      if (k === dedupeKey) return;
    }

    await svcClient.from("signal_source_suggestions").insert({
      category: opts.category,
      suggested_name: name.slice(0, 240),
      suggested_url: url.slice(0, 2000),
      suggested_type: "blog",
      dedupe_key: dedupeKey,
      status: "pending",
      metadata: {
        origin: `live_${opts.category}`,
        pause_instance_id: opts.pauseInstanceId ?? null,
      },
    });
  } catch (e) {
    console.error("[enqueueCatalogSourceSuggestion]", e);
  }
}
