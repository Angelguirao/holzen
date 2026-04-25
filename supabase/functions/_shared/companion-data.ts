/**
 * Companion data abstraction — Pause V2.
 *
 * Writes go to `pause_ai_artifacts`, one row per (pause_instance_id, kind).
 * The legacy `reflection_companions` table was dropped in the Pause V2
 * cutover migration; all callers must supply pauseInstanceId + userId.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface CompanionContent {
  [key: string]: unknown;
}

export async function writeCompanionData(
  svcClient: SupabaseClient,
  pauseInstanceId: string,
  userId: string,
  companionType: string,
  content: CompanionContent,
): Promise<void> {
  await svcClient.from("pause_ai_artifacts").upsert(
    {
      pause_instance_id: pauseInstanceId,
      user_id: userId,
      kind: companionType,
      content,
    },
    { onConflict: "pause_instance_id,kind" },
  );
}

export async function readCompanionData(
  svcClient: SupabaseClient,
  pauseInstanceId: string,
): Promise<Record<string, { content: CompanionContent } | null>> {
  const result: Record<string, { content: CompanionContent } | null> = {
    signal: null,
    ground_nudge: null,
    historical_insight: null,
    zoom_out: null,
    zoom_out_deep_time: null,
    haiku: null,
  };

  const { data: rows } = await svcClient
    .from("pause_ai_artifacts")
    .select("kind, content")
    .eq("pause_instance_id", pauseInstanceId);

  if (rows) {
    for (const r of rows as Array<{ kind: string; content: CompanionContent }>) {
      result[r.kind] = { content: r.content };
    }
  }

  return result;
}
