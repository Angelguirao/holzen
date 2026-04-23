/**
 * Companion data abstraction layer.
 *
 * Writes go to **two places in parallel** during the Pause V2 cutover:
 *   1. `reflection_companions` (legacy) — still canonical while `pause_v2_enabled=false`.
 *   2. `pause_ai_artifacts` (new) — the V2 home, written only when callers pass a
 *      `pauseInstanceId` (the orchestrator does when the cron / hook fired with V2 on).
 *
 * At Phase J (cutover) we set `pause_v2_enabled=true` and keep both writes; at Phase L
 * we drop the legacy write and delete `reflection_companions` altogether. Until then,
 * the mirror is defensive: a failed V2 write must never block the legacy path, so we
 * wrap it in a try/catch and log only (the orchestrator already logs dependency calls).
 */

interface CompanionContent {
  [key: string]: unknown;
}

/**
 * Write companion data for a reflection.
 * - Always writes `reflection_companions` (legacy, still canonical during cutover).
 * - Additionally writes `pause_ai_artifacts` when `pauseInstanceId` + `userId` are
 *   provided. Passes silently if either is missing.
 */
export async function writeCompanionData(
  svcClient: any,
  reflectionId: string,
  companionType: string,
  content: CompanionContent,
  options?: { pauseInstanceId?: string | null; userId?: string | null },
): Promise<void> {
  await svcClient.from("reflection_companions").upsert(
    {
      reflection_id: reflectionId,
      companion_type: companionType,
      content,
    },
    { onConflict: "reflection_id,companion_type" },
  );

  const pauseInstanceId = options?.pauseInstanceId ?? null;
  const userId = options?.userId ?? null;
  if (pauseInstanceId && userId) {
    try {
      await svcClient.from("pause_ai_artifacts").upsert(
        {
          pause_instance_id: pauseInstanceId,
          user_id: userId,
          kind: companionType,
          content,
        },
        { onConflict: "pause_instance_id,kind" },
      );
    } catch (e) {
      // Never fail the legacy path on V2 mirror errors.
      console.error("[pause_v2] pause_ai_artifacts mirror upsert failed", {
        companionType,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

/**
 * Read companion data for a reflection from reflection_companions.
 */
export async function readCompanionData(
  svcClient: any,
  reflectionId: string,
): Promise<Record<string, { content: CompanionContent; read: boolean } | null>> {
  const result: Record<string, { content: CompanionContent; read: boolean } | null> = {
    signal: null,
    ground_nudge: null,
    historical_insight: null,
    zoom_out: null,
  };

  const { data: companions } = await svcClient
    .from("reflection_companions")
    .select("companion_type, content, read")
    .eq("reflection_id", reflectionId);

  if (companions) {
    for (const c of companions) {
      result[c.companion_type] = { content: c.content, read: c.read ?? false };
    }
  }

  return result;
}

/**
 * Mark a companion as read for a reflection (reflection_companions only).
 *
 * The V2 equivalent is a `pause_companion_events` row with
 * `action='complete'`, logged via the `pause_log_companion` RPC — that
 * surface belongs to Phase E (pause-session UI).
 */
export async function markCompanionRead(
  svcClient: any,
  reflectionId: string,
  companionType: string,
): Promise<void> {
  await svcClient
    .from("reflection_companions")
    .update({ read: true })
    .eq("reflection_id", reflectionId)
    .eq("companion_type", companionType);
}
