export type PauseAiArtifactRow = {
  kind: string;
  content: Record<string, unknown>;
};

/** Parse `pause_ai_artifacts.content.message` for `kind === 'reflection_text'`. */
export function reflectionTextMessageFromContent(content: unknown): string | null {
  const c = content as Record<string, unknown> | null;
  if (typeof c?.message !== 'string') return null;
  const trimmed = c.message.trim();
  return trimmed || null;
}

/** First non-empty `reflection_text` message in artifact rows (batch reads). */
export function reflectionTextMessageFromArtifactRows(
  rows: ReadonlyArray<PauseAiArtifactRow>,
): string | null {
  for (const row of rows) {
    if (row.kind !== 'reflection_text') continue;
    const message = reflectionTextMessageFromContent(row.content);
    if (message) return message;
  }
  return null;
}
