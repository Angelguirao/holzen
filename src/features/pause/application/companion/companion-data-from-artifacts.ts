import type { CompanionData } from '@/features/pause/public';

export function companionDataFromArtifacts(
  rows: Array<{ kind: string; content: Record<string, unknown> }>,
): CompanionData {
  let haiku: string | null = null;
  let groundingTitle: string | null = null;
  let groundingBody: string | null = null;
  for (const r of rows) {
    if (r.kind === 'haiku' && typeof r.content?.haiku === 'string') {
      haiku = r.content.haiku as string;
    } else if (r.kind === 'ground_nudge') {
      if (typeof r.content?.title === 'string') groundingTitle = r.content.title as string;
      if (typeof r.content?.body === 'string') groundingBody = r.content.body as string;
    }
  }
  return { haiku, groundingTitle, groundingBody };
}
