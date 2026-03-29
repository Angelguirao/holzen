/**
 * Companion data abstraction layer.
 *
 * All companion data lives in the reflection_companions join table.
 * Legacy denormalized columns on reflections have been dropped
 * (signal_*, zoom_out_data/read, history_insight_data/read).
 *
 * Grounding still dual-writes grounding_title/body to reflections
 * for Home page pinned reflection display.
 */

import { COMPANION_TYPES } from "./companion-types.ts";

interface CompanionContent {
  [key: string]: unknown;
}

/**
 * Write companion data for a reflection.
 * Writes to reflection_companions (primary).
 * For grounding, also writes title/body to reflections for Home display.
 */
export async function writeCompanionData(
  svcClient: any,
  reflectionId: string,
  companionType: string,
  content: CompanionContent,
): Promise<void> {
  // Write to normalized table
  await svcClient.from("reflection_companions").upsert(
    {
      reflection_id: reflectionId,
      companion_type: companionType,
      content,
    },
    { onConflict: "reflection_id,companion_type" },
  );

  // Grounding: also write title/body to reflections for Home pinned display
  if (companionType === COMPANION_TYPES.GROUNDING) {
    await svcClient
      .from("reflections")
      .update({
        grounding_title: content.title || null,
        grounding_body: content.body || null,
      })
      .eq("id", reflectionId);
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
 * Mark a companion as read for a reflection.
 * Updates reflection_companions. Also updates grounding_read on reflections.
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

  // Grounding read flag still on reflections
  if (companionType === COMPANION_TYPES.GROUNDING) {
    await svcClient
      .from("reflections")
      .update({ grounding_read: true })
      .eq("id", reflectionId);
  }
}
