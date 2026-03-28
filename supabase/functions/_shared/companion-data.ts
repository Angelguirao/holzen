/**
 * Companion data abstraction layer.
 *
 * During the normalization transition, companion data exists in two places:
 * 1. Denormalized columns on the reflections table (old)
 * 2. The reflection_companions join table (new)
 *
 * This module provides read/write helpers that:
 * - WRITE to both locations (dual-write for backward compatibility)
 * - READ from the new table first, falling back to old columns
 *
 * After all consumers are migrated to use this module, the old columns
 * can be dropped and this module simplified to use only the new table.
 */

import { COMPANION_TYPES } from "./companion-types.ts";

interface CompanionContent {
  [key: string]: unknown;
}

/**
 * Write companion data for a reflection.
 * Dual-writes to both the old denormalized columns and the new join table.
 */
export async function writeCompanionData(
  svcClient: any,
  reflectionId: string,
  companionType: string,
  content: CompanionContent,
): Promise<void> {
  // Write to new normalized table
  try {
    await svcClient.from("reflection_companions").upsert(
      {
        reflection_id: reflectionId,
        companion_type: companionType,
        content,
      },
      { onConflict: "reflection_id,companion_type" },
    );
  } catch (e) {
    // Table may not exist yet — fall through to old-style write
    console.warn(`[companion-data] reflection_companions write failed (table may not exist): ${e}`);
  }

  // Also write to old denormalized columns for backward compatibility
  const updates = buildLegacyUpdate(companionType, content);
  if (Object.keys(updates).length > 0) {
    const { error } = await svcClient
      .from("reflections")
      .update(updates)
      .eq("id", reflectionId);
    if (error) {
      console.error(`[companion-data] legacy reflection update failed: ${error.message}`);
    }
  }
}

/**
 * Read companion data for a reflection.
 * Tries the new join table first, falls back to old denormalized columns.
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

  // Try new normalized table first
  try {
    const { data: companions } = await svcClient
      .from("reflection_companions")
      .select("companion_type, content, read")
      .eq("reflection_id", reflectionId);

    if (companions && companions.length > 0) {
      for (const c of companions) {
        result[c.companion_type] = { content: c.content, read: c.read ?? false };
      }
      return result;
    }
  } catch {
    // Table may not exist yet — fall through to legacy read
  }

  // Fall back to old denormalized columns
  const { data: row } = await svcClient
    .from("reflections")
    .select("signal_title, signal_body, signal_source, signal_url, signal_read, grounding_title, grounding_body, grounding_citation, grounding_url, grounding_read, zoom_out_data, zoom_out_read, history_insight_data, history_read")
    .eq("id", reflectionId)
    .single();

  if (!row) return result;

  if ((row as any).signal_source) {
    result.signal = {
      content: {
        title: (row as any).signal_title ?? "",
        body: (row as any).signal_body ?? "",
        source: (row as any).signal_source,
        url: (row as any).signal_url ?? "",
      },
      read: (row as any).signal_read ?? false,
    };
  }

  if ((row as any).grounding_citation) {
    result.ground_nudge = {
      content: {
        title: (row as any).grounding_title ?? "",
        body: (row as any).grounding_body ?? "",
        citation: (row as any).grounding_citation,
        url: (row as any).grounding_url ?? "",
      },
      read: (row as any).grounding_read ?? false,
    };
  }

  if ((row as any).history_insight_data) {
    result.historical_insight = {
      content: (row as any).history_insight_data,
      read: (row as any).history_read ?? false,
    };
  }

  if ((row as any).zoom_out_data) {
    result.zoom_out = {
      content: (row as any).zoom_out_data,
      read: (row as any).zoom_out_read ?? false,
    };
  }

  return result;
}

/**
 * Mark a companion as read for a reflection.
 * Updates both the new table and old column.
 */
export async function markCompanionRead(
  svcClient: any,
  reflectionId: string,
  companionType: string,
): Promise<void> {
  // New table
  try {
    await svcClient
      .from("reflection_companions")
      .update({ read: true })
      .eq("reflection_id", reflectionId)
      .eq("companion_type", companionType);
  } catch { /* table may not exist */ }

  // Old column
  const readColumnMap: Record<string, string> = {
    [COMPANION_TYPES.SIGNAL]: "signal_read",
    [COMPANION_TYPES.GROUNDING]: "grounding_read",
    [COMPANION_TYPES.HISTORY]: "history_read",
    [COMPANION_TYPES.ZOOM_OUT]: "zoom_out_read",
    /** Orchestrator uses `zoom_out_deep_time` in join table; same legacy read column as `zoom_out`. */
    [COMPANION_TYPES.ZOOM_OUT_DEEP_TIME]: "zoom_out_read",
  };
  const col = readColumnMap[companionType];
  if (col) {
    await svcClient
      .from("reflections")
      .update({ [col]: true } as any)
      .eq("id", reflectionId);
  }
}

// ── Private helpers ──

function buildLegacyUpdate(companionType: string, content: CompanionContent): Record<string, any> {
  switch (companionType) {
    case COMPANION_TYPES.SIGNAL:
      return {
        signal_title: content.title || null,
        signal_body: content.body || null,
        signal_source: content.source || null,
        signal_url: content.url || null,
      };
    case COMPANION_TYPES.GROUNDING:
      return {
        grounding_title: content.title || null,
        grounding_body: content.body || null,
        grounding_citation: content.citation || null,
        grounding_url: content.url || null,
      };
    case COMPANION_TYPES.HISTORY:
      return { history_insight_data: content };
    case COMPANION_TYPES.ZOOM_OUT:
    case COMPANION_TYPES.ZOOM_OUT_DEEP_TIME:
      return { zoom_out_data: content };
    default:
      return {};
  }
}
