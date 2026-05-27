import { reflectionMessageFromArtifactContent } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export type PauseAiArtifactRow = {
  kind: string;
  content: Record<string, unknown>;
};

/** Parse `pause_ai_artifacts.content` for `kind === 'reflection_text` (v2 or legacy `message`). */
export function reflectionTextMessageFromContent(content: unknown): string | null {
  return reflectionMessageFromArtifactContent(content);
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
