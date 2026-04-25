/**
 * Intervention Selector — determines which cognitive intervention to deliver
 * for a given pause session.
 *
 * This is the core behavioral logic of the new Holzen design.
 * It replaces "generate all companions" with "select the minimum effective intervention."
 *
 * Priority order:
 * 1. Mirror — user has a qualifying past session with a recorded outcome
 * 2. Trap  — emotionally activated (fearful/anxious/fomo/greedy) in a matched direction
 * 3. Pattern — high-severity move with no strong emotional signal
 * 4. Question Mode — experienced user, mild move
 * 5. Pattern (default) — safe fallback for new users
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { buildMirror, type MirrorResult } from "./generators/mirror.ts";

export type InterventionMode = "insight" | "question";
export type PrimaryType = "mirror" | "pattern" | "trap";
export type SecondaryType = "zoom_out";

export interface InterventionSelection {
  mode: InterventionMode;
  /** Only present in insight mode */
  primary?: PrimaryType;
  /** Only added when severity=high and primary is not mirror */
  secondary?: SecondaryType;
  /** Pre-fetched mirror data — avoids a second DB call in the orchestrator */
  mirrorData?: MirrorResult | null;
}

export interface SelectInterventionParams {
  userId: string;
  pauseInstanceId: string;
  mood?: string;
  severity: "mild" | "moderate" | "high";
  direction: "up" | "down" | "neutral";
  moodHistory?: Array<{ mood: string; outcome?: string | null }>;
  svcClient: SupabaseClient;
  log?: (msg: string, extra?: Record<string, unknown>) => void;
}

/**
 * Parse market direction from the context string as a convenience helper.
 * "BTC is down 7.2%..." → "down"
 */
export function parseDirection(context?: string): "up" | "down" | "neutral" {
  if (!context) return "neutral";
  const lower = context.toLowerCase();
  if (lower.includes("is down")) return "down";
  if (lower.includes("is up")) return "up";
  return "neutral";
}

/**
 * Convert a numeric severity (percent change) to a bucketed level.
 */
export function bucketSeverity(pct: number): "mild" | "moderate" | "high" {
  const abs = Math.abs(pct);
  if (abs >= 10) return "high";
  if (abs >= 5) return "moderate";
  return "mild";
}

/**
 * Count the user's total past completed pauses. Used to gate Question Mode
 * (only shown to users with enough history to benefit from self-reflection).
 */
async function countPastSessions(svcClient: SupabaseClient, userId: string): Promise<number> {
  try {
    const { count, error } = await svcClient
      .from("pause_instances")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("state", "completed");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function selectIntervention(
  params: SelectInterventionParams,
): Promise<InterventionSelection> {
  const { userId, pauseInstanceId, mood, severity, direction, moodHistory, svcClient, log } = params;
  void moodHistory; // reserved for future heuristics

  // ── 1. Mirror check (highest priority) ──
  const mirrorData = await buildMirror(svcClient, userId, pauseInstanceId, log);
  if (mirrorData) {
    log?.("mirror: eligible — past session found");
    return {
      mode: "insight",
      primary: "mirror",
      mirrorData,
    };
  }

  const sessionCount = await countPastSessions(svcClient, userId);
  if (sessionCount <= 1) {
    log?.(`mirror: ineligible — new user (${sessionCount} sessions)`);
  } else {
    log?.(`mirror: ineligible — ${sessionCount} sessions but no qualifying match`);
  }

  // ── 2. Trap — emotionally activated states ──
  const fearMoods = ["fearful", "anxious"];
  const fomoMoods = ["fomo", "greedy", "excited"];

  if (fearMoods.includes(mood ?? "") && direction === "down") {
    return {
      mode: "insight",
      primary: "trap",
      secondary: severity === "high" ? "zoom_out" : undefined,
    };
  }

  if (fomoMoods.includes(mood ?? "") && direction === "up") {
    return {
      mode: "insight",
      primary: "trap",
      secondary: severity === "high" ? "zoom_out" : undefined,
    };
  }

  if (["fomo", "greedy"].includes(mood ?? "") && direction === "down") {
    return {
      mode: "insight",
      primary: "trap",
      secondary: severity === "high" ? "zoom_out" : undefined,
    };
  }

  // ── 3. Pattern — high-severity move ──
  if (severity === "high") {
    return {
      mode: "insight",
      primary: "pattern",
      secondary: "zoom_out",
    };
  }

  // ── 4. Question Mode ──
  if (severity === "mild") {
    const sc = await countPastSessions(svcClient, userId);
    if (sc >= 20) {
      return { mode: "question" };
    }
  }

  // ── 5. Default ──
  return {
    mode: "insight",
    primary: "pattern",
    secondary: severity === "moderate" ? "zoom_out" : undefined,
  };
}
