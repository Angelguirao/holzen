import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Mirror intervention — surfaces a user's own past behavior in a similar market moment.
 *
 * Pause V2 implementation: queries `v_pause_full` for past completed pauses
 * that share direction (up/down) and are at least 30 days old. Uses the
 * pause's initial_mood + outcome + context snapshot to build a short
 * "X ago you were feeling Y when Z. You chose to A." narrative.
 *
 * Returns null if no qualifying past session exists.
 */

export interface MirrorResult {
  /** Relative time string, e.g. "3 months ago" */
  timeAgo: string;
  /** The mood the user reported in that past session */
  pastMood: string;
  /** The market context from that session, e.g. "BTC was down 6.8%" */
  pastContext: string;
  /** The decision the user made: "held", "sold", or "bought" */
  pastOutcome: string;
  /** The assembled narrative sentence shown to the user */
  message: string;
}

function timeAgoFrom(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function extractContext(context: string | null): string {
  if (!context) return "a similar move";
  const normalized = context.replace(/^BTC is/, "BTC was");
  const trimmed = normalized.split(/\.\s/)[0].replace(/\s+in the last.*/, "").trim();
  return trimmed || "a similar move";
}

function humanizeOutcome(outcome: string | null): string {
  switch (outcome) {
    case "sold":
      return "sold";
    case "bought":
      return "bought more";
    case "held":
    case "nothing":
    default:
      return "held";
  }
}

function normalizeDirection(raw: unknown): "up" | "down" | "neutral" {
  if (raw === "up" || raw === "down") return raw;
  return "neutral";
}

export async function buildMirror(
  svcClient: SupabaseClient,
  userId: string,
  pauseInstanceId: string,
  log?: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<MirrorResult | null> {
  try {
    // 1. Read the current pause to get its direction.
    const { data: current, error: curErr } = await svcClient
      .from("pause_instances")
      .select("context_snapshot, created_at")
      .eq("id", pauseInstanceId)
      .maybeSingle();
    if (curErr || !current) return null;

    const currentDir = normalizeDirection(
      (current.context_snapshot as Record<string, unknown> | null)?.direction,
    );
    if (currentDir === "neutral") return null;

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Query v_pause_full for a past completed pause with matching direction.
    //    We rely on the view's counted companion + mood + outcome columns.
    const { data, error } = await svcClient
      .from("v_pause_full")
      .select(
        "id, user_id, created_at, completed_at, context_snapshot, initial_mood, outcome, state",
      )
      .eq("user_id", userId)
      .eq("state", "completed")
      .not("outcome", "is", null)
      .lt("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (error) {
      log?.("v_pause_full mirror query error", { error: error.message });
      return null;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      created_at: string;
      completed_at: string | null;
      context_snapshot: Record<string, unknown> | null;
      initial_mood: string | null;
      outcome: string | null;
    }>;

    const match = rows.find((r) => {
      const dir = normalizeDirection(r.context_snapshot?.direction);
      return dir === currentDir;
    });
    if (!match) return null;

    const whenIso = match.completed_at ?? match.created_at;
    const timeAgo = timeAgoFrom(whenIso);
    const pastMood = match.initial_mood || "uncertain";
    const pastContextText =
      typeof match.context_snapshot?.context_text === "string"
        ? (match.context_snapshot.context_text as string)
        : null;
    const pastContext = extractContext(pastContextText);
    const pastOutcome = humanizeOutcome(match.outcome);

    const message = `${timeAgo}, you were feeling ${pastMood} when ${pastContext}. You chose to ${pastOutcome}.`;

    return { timeAgo, pastMood, pastContext, pastOutcome, message };
  } catch (e) {
    log?.("unexpected error", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
