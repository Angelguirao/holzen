/** Structured Reflect copy (`pause_ai_artifacts.reflection_text` schema v2). */

export const REFLECTION_CONTENT_SCHEMA_VERSION = 2 as const;

export type ReflectionContentV2 = {
  schemaVersion: typeof REFLECTION_CONTENT_SCHEMA_VERSION;
  land: string;
  hypothesis: string;
  inquiry: string;
  contextStrip?: string | null;
  message: string;
};

export type CurrentFeelForReflect = {
  mood: string;
  intensity?: number;
  tileId?: string;
  tileLabel?: string;
};

export function composeReflectionMessage(parts: {
  land: string;
  hypothesis: string;
  inquiry: string;
}): string {
  return [parts.land.trim(), parts.hypothesis.trim(), parts.inquiry.trim()].filter(Boolean).join('\n\n');
}

export {
  composeReflectFallbackOneVoice,
} from '../../../../../../supabase/functions/_shared/reflect-fallback-templates.ts';

export function reflectionContentV2(input: {
  land: string;
  hypothesis: string;
  inquiry: string;
  contextStrip?: string | null;
  /** LLM-integrated prose for display; structured fields kept for analytics. */
  integratedMessage?: string | null;
}): ReflectionContentV2 {
  const land = input.land.trim();
  const hypothesis = input.hypothesis.trim();
  const inquiry = input.inquiry.trim();
  const contextStrip = input.contextStrip?.trim() || null;
  const stitched = composeReflectionMessage({ land, hypothesis, inquiry });
  const integrated = input.integratedMessage?.trim();
  return {
    schemaVersion: REFLECTION_CONTENT_SCHEMA_VERSION,
    land,
    hypothesis,
    inquiry,
    contextStrip,
    message: integrated && integrated.length >= 20 ? integrated : stitched,
  };
}

/** v1 artifacts and plain strings → v2 with copy in `land`. */
export function reflectionContentFromLegacyMessage(message: string): ReflectionContentV2 {
  const trimmed = message.trim();
  return reflectionContentV2({
    land: trimmed,
    hypothesis: '',
    inquiry: '',
    contextStrip: null,
  });
}

export function reflectionContentFromArtifactContent(content: unknown): ReflectionContentV2 | null {
  if (!content || typeof content !== 'object') return null;
  const c = content as Record<string, unknown>;
  if (c.schemaVersion === REFLECTION_CONTENT_SCHEMA_VERSION) {
    const land = typeof c.land === 'string' ? c.land.trim() : '';
    const hypothesis = typeof c.hypothesis === 'string' ? c.hypothesis.trim() : '';
    const inquiry = typeof c.inquiry === 'string' ? c.inquiry.trim() : '';
    const stitched = composeReflectionMessage({ land, hypothesis, inquiry });
    const storedMessage =
      typeof c.message === 'string' && c.message.trim() ? c.message.trim() : stitched;
    if (!storedMessage && !land && !inquiry) return null;
    return {
      schemaVersion: REFLECTION_CONTENT_SCHEMA_VERSION,
      land,
      hypothesis,
      inquiry,
      contextStrip: typeof c.contextStrip === 'string' ? c.contextStrip.trim() || null : null,
      message: storedMessage,
    };
  }
  if (typeof c.message === 'string' && c.message.trim()) {
    return reflectionContentFromLegacyMessage(c.message);
  }
  return null;
}

export function reflectionMessageFromArtifactContent(content: unknown): string | null {
  const structured = reflectionContentFromArtifactContent(content);
  if (structured?.message) return structured.message;
  return null;
}

export function hasReflectDisplayCopy(content: ReflectionContentV2 | null | undefined): boolean {
  if (!content) return false;
  return Boolean(
    content.message.trim() ||
      content.land.trim() ||
      content.inquiry.trim() ||
      content.hypothesis.trim(),
  );
}
