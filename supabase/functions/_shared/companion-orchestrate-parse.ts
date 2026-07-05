import type { OrchestrateSourceInput } from "./companion-orchestrate-types.ts";

export function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items : undefined;
}

export function asSourceArray(value: unknown): OrchestrateSourceInput[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const entry = item as Record<string, unknown>;
    if (typeof entry.name !== "string" || entry.name.length === 0) return [];
    if (typeof entry.type !== "string" || entry.type.length === 0) return [];

    const source: OrchestrateSourceInput = { name: entry.name, type: entry.type };
    if (typeof entry.url === "string" && entry.url.length > 0) {
      source.url = entry.url;
    }
    return [source];
  });

  return items.length > 0 ? items : undefined;
}

import { hasHistoricalInsightBody } from "./historical-insight-wire.ts";

export function isCompanionContent(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function contentSatisfiesCompanion(companionType: string, raw: unknown): boolean {
  if (raw == null || typeof raw !== "object") return false;
  const c = raw as Record<string, unknown>;
  switch (companionType) {
    case "signal":
      return typeof c.source === "string" && c.source.length > 0;
    case "ground_nudge":
      return typeof c.title === "string" && c.title.length > 0 &&
        typeof c.body === "string" && c.body.length > 0;
    case "historical_insight":
      return hasHistoricalInsightBody(c);
    case "zoom_out":
    case "zoom_out_deep_time":
      return Object.keys(c).length > 0;
    case "intervention":
      return typeof c.mode === "string" && c.mode.length > 0;
    default:
      return false;
  }
}
