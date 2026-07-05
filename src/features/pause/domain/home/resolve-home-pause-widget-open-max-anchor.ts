import { resolvePauseOpenMaxAnchorAt } from '@/features/pause/domain/pause-open-max-anchor';

/** Home widget open_max countdown anchor for engaged rows. */
export function resolveHomePauseWidgetOpenMaxAnchorAt(input: {
  openPauseState: 'active' | 'engaged' | null;
  openPauseSource: string | null;
  openPauseEngagedAt: string | null;
  openPauseCreatedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
}): string | null {
  if (input.openPauseState !== 'engaged' || !input.openPauseCreatedAt) return null;
  return resolvePauseOpenMaxAnchorAt({
    state: 'engaged',
    source: input.openPauseSource,
    engaged_at: input.openPauseEngagedAt,
    created_at: input.openPauseCreatedAt,
    metadata: input.openPauseMetadata,
  });
}
