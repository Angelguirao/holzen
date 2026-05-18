function asPayloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

/**
 * Whether the Reflect companion strip should treat “breathing” as done.
 * - **Legacy:** any `breath_completed` row whose payload has no numeric `breath_segment` of 1 or 2 (e.g. `{}`, `{ skipped: true }`) counts as the single old ritual breath.
 * - **Six-step ritual:** require at least one row covering segment **1** and one covering segment **2** (`breath_segment` in payload).
 */
export function deriveBreathingUiCompleteFromPayloads(
  rows: ReadonlyArray<{ payload?: unknown }>,
): boolean {
  if (!rows.length) return false;

  for (const row of rows) {
    const p = asPayloadRecord(row.payload);
    if (p.brief_ritual === true) {
      const raw = p.breath_segment;
      if (raw === undefined || raw === null || raw === '') continue;
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (n === 1) return true;
    }
  }

  let seg1 = false;
  let seg2 = false;
  let hasSegmentedBreath = false;

  for (const row of rows) {
    const p = asPayloadRecord(row.payload);
    const raw = p.breath_segment;
    if (raw === undefined || raw === null || raw === '') continue;
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (n === 1) {
      hasSegmentedBreath = true;
      seg1 = true;
    } else if (n === 2) {
      hasSegmentedBreath = true;
      seg2 = true;
    }
  }

  if (hasSegmentedBreath) {
    return seg1 && seg2;
  }

  return rows.length > 0;
}
