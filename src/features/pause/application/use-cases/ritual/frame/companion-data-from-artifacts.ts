import type { CompanionData } from '@/features/pause/domain/companion-card-types';

/** Haiku-only companion slice from `pause_ai_artifacts` (grounding uses `ground_nudge` + orchestrate). */
export function companionDataFromArtifacts(
  rows: Array<{ kind: string; content: Record<string, unknown> }>,
): CompanionData {
  let haiku: string | null = null;
  for (const r of rows) {
    if (r.kind === 'haiku' && typeof r.content?.haiku === 'string') {
      haiku = r.content.haiku as string;
    }
  }
  return { haiku };
}
