import {
  composeReflectionMessage,
  type ReflectionContentV2,
} from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/**
 * Display body for the Reflect card: prefer server/LLM `message` (one voice),
 * else stitch structured fields; append context strip when present.
 */
export function formatReflectIntegratedProse(content: ReflectionContentV2): string {
  const contextStrip = content.contextStrip?.trim();
  const integrated = content.message.trim();

  if (integrated.length >= 20) {
    const curatedOneVoice = !integrated.includes('\n\n') && !content.hypothesis.trim();
    if (!contextStrip || curatedOneVoice) {
      return integrated;
    }
    return `${integrated}\n\n${contextStrip}`;
  }

  const land = content.land.trim();
  const hypothesis = content.hypothesis.trim();
  let inquiry = content.inquiry.trim();
  const paragraphs: string[] = [];

  if (land) paragraphs.push(land);
  if (hypothesis) paragraphs.push(hypothesis);
  if (inquiry) {
    if (!inquiry.endsWith('?')) inquiry = `${inquiry}?`;
    paragraphs.push(inquiry);
  }

  const core = paragraphs.length > 0 ? paragraphs.join('\n\n') : integrated;
  if (!core) return contextStrip ?? '';
  return contextStrip ? `${core}\n\n${contextStrip}` : core;
}

/** @internal — for tests comparing stitch vs integrated preference */
export function stitchReflectFieldsForDisplay(content: ReflectionContentV2): string {
  let inquiry = content.inquiry.trim();
  if (inquiry && !inquiry.endsWith('?')) inquiry = `${inquiry}?`;
  return composeReflectionMessage({
    land: content.land,
    hypothesis: content.hypothesis,
    inquiry,
  });
}
