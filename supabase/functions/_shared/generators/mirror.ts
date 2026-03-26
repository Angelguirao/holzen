/**
 * Mirror intervention — surfaces a user's own past behavior in a similar market moment.
 *
 * Uses the existing `find_similar_reflection` DB function (no embeddings, no AI).
 * Returns null if the user has no qualifying past session.
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

/**
 * Compute a human-readable relative time string from a past ISO timestamp.
 */
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

/**
 * Extract a short market description from the stored context string.
 * Input: "BTC is down 5.2% in the last 24 hours."
 * Output: "BTC was down 5.2%"
 */
function extractContext(context: string | null): string {
  if (!context) return "a similar move";
  // Normalize "BTC is" → "BTC was"
  const normalized = context.replace(/^BTC is/, "BTC was");
  // Trim to just the first sentence / first clause
  const trimmed = normalized.split(/\.\s/)[0].replace(/\s+in the last.*/, "").trim();
  return trimmed || "a similar move";
}

/**
 * Humanize the outcome label for display.
 */
function humanizeOutcome(outcome: string | null): string {
  switch (outcome) {
    case "sold": return "sold";
    case "bought": return "bought more";
    case "held":
    case "nothing":
    default: return "held";
  }
}

/**
 * Build a Mirror result from the user's past similar reflection.
 * Returns null if no qualifying past session exists.
 */
export async function buildMirror(
  svcClient: any,
  userId: string,
  reflectionId: string,
): Promise<MirrorResult | null> {
  try {
    const { data, error } = await svcClient.rpc("find_similar_reflection", {
      _user_id: userId,
      _reflection_id: reflectionId,
      _min_age_days: 30,
    });

    if (error) {
      console.error("[MIRROR] find_similar_reflection error:", error.message);
      return null;
    }

    // RETURNS TABLE gives an array; take the first row
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.outcome) return null;

    const timeAgo = timeAgoFrom(row.created_at);
    const pastMood = row.mood || "uncertain";
    const pastContext = extractContext(row.context);
    const pastOutcome = humanizeOutcome(row.outcome);

    const message = `${timeAgo}, you were feeling ${pastMood} when ${pastContext}. You chose to ${pastOutcome}.`;

    return { timeAgo, pastMood, pastContext, pastOutcome, message };
  } catch (e) {
    console.error("[MIRROR] unexpected error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
