import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

/**
 * One reflection body for the card (design-approved layout): land → hypothesis → inquiry,
 * optional context strip, no section labels or Feel-step recap.
 */
export function formatReflectIntegratedProse(content: ReflectionContentV2): string {
  const paragraphs: string[] = [];
  const land = content.land.trim();
  const hypothesis = content.hypothesis.trim();
  let inquiry = content.inquiry.trim();

  if (land) paragraphs.push(land);
  if (hypothesis) paragraphs.push(hypothesis);
  if (inquiry) {
    if (!inquiry.endsWith('?')) inquiry = `${inquiry}?`;
    paragraphs.push(inquiry);
  }

  if (paragraphs.length === 0 && content.message.trim()) {
    paragraphs.push(content.message.trim());
  }

  const contextStrip = content.contextStrip?.trim();
  if (contextStrip) paragraphs.push(contextStrip);

  return paragraphs.join('\n\n');
}
