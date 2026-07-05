import {
  reflectionContentFromLegacyMessage,
  reflectionContentV2,
  type ReflectionContentV2,
} from '@/features/pause/domain/reflect/generation/reflection-content-v2';

export type HolzenReflectResponse = {
  schemaVersion?: number;
  land?: string;
  hypothesis?: string;
  inquiry?: string;
  contextStrip?: string;
  message?: string;
  haiku?: string | null;
};

/** Map edge `holzen-reflect` JSON to structured Reflect content (v2 or legacy). */
export function reflectionContentFromHolzenReflectResponse(
  data: HolzenReflectResponse | null | undefined,
): ReflectionContentV2 | null {
  if (!data) return null;
  if (data.schemaVersion === 2) {
    const land = (data.land ?? '').trim();
    const hypothesis = (data.hypothesis ?? '').trim();
    const inquiry = (data.inquiry ?? '').trim();
    const contextStrip = (data.contextStrip ?? '').trim() || null;
    const integratedMessage = data.message?.trim();
    if (!land && !inquiry && !integratedMessage) return null;
    return reflectionContentV2({
      land: land || integratedMessage?.split(/\n\n/)[0]?.trim() || '',
      hypothesis,
      inquiry,
      contextStrip,
      integratedMessage,
    });
  }
  const message = data.message?.trim();
  if (!message) return null;
  return reflectionContentFromLegacyMessage(message);
}
