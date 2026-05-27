import { composeReflectionMessage, type ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { formatReflectDisplayLetter } from '@/features/pause/domain/reflect/generation/format-reflect-display-letter';

/** @deprecated Prefer `formatReflectDisplayLetter` — same behavior (one letter, no context strip). */
export function formatReflectIntegratedProse(content: ReflectionContentV2): string {
  return formatReflectDisplayLetter(content);
}

export { formatReflectDisplayLetter, normalizeReflectLetter } from '@/features/pause/domain/reflect/generation/format-reflect-display-letter';

/** @internal — multi-paragraph stitch for tests / legacy artifacts only */
export function stitchReflectFieldsForDisplay(content: ReflectionContentV2): string {
  let inquiry = content.inquiry.trim();
  if (inquiry && !inquiry.endsWith('?')) inquiry = `${inquiry}?`;
  return composeReflectionMessage({
    land: content.land,
    hypothesis: content.hypothesis,
    inquiry,
  });
}
