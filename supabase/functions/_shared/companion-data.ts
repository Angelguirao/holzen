/**
 * Companion data abstraction layer.
 *
 * All companion content lives in reflection_companions. Legacy denormalized columns on
 * reflections were dropped for signal / zoom / history. Grounding text and read state are
 * also stored only on the `ground_nudge` row; v_reflection_with_companions COALESCEs the
 * join with legacy reflections.grounding_* for old rows. Do not write grounding_* on reflections.
 */

interface CompanionContent {
  [key: string]: unknown;
}

/**
 * Write companion data for a reflection (reflection_companions only).
 */
export async function writeCompanionData(
  svcClient: any,
  reflectionId: string,
  companionType: string,
  content: CompanionContent,
): Promise<void> {
  await svcClient.from("reflection_companions").upsert(
    {
      reflection_id: reflectionId,
      companion_type: companionType,
      content,
    },
    { onConflict: "reflection_id,companion_type" },
  );
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
