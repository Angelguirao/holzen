import {
  composeReflectFallbackOneVoice,
  composeReflectionMessage,
  type ReflectionContentV2,
} from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/**
 * Collapse over-paragraph LLM output into at most one break before the closing question.
 */
export function normalizeReflectLetter(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '';

  const paragraphs = trimmed
    .replace(/\n{3,}/g, '\n\n')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) return paragraphs[0] ?? trimmed;

  const last = paragraphs[paragraphs.length - 1] ?? '';
  const closingQuestion = last.endsWith('?');
  if (paragraphs.length === 2) {
    return paragraphs.join('\n\n');
  }

  if (closingQuestion) {
    const body = paragraphs.slice(0, -1).join(' ');
    return `${body}\n\n${last}`;
  }

  return paragraphs.join(' ');
}

/**
 * Single reflection letter for the Reflect card — never includes market telemetry or context strip.
 */
export function formatReflectDisplayLetter(content: ReflectionContentV2): string {
  const integrated = content.message.trim();
  const oneVoice = composeReflectFallbackOneVoice(
    content.land,
    content.hypothesis,
    content.inquiry,
  );
  const stitched = composeReflectionMessage({
    land: content.land,
    hypothesis: content.hypothesis,
    inquiry: content.inquiry,
  });

  if (integrated.length < 20) return oneVoice;
  if (integrated === stitched) return oneVoice;

  return normalizeReflectLetter(integrated);
}
