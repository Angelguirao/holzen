import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import type { OpenPauseHomePreviewSnapshotSource } from '@/features/pause/domain/home/open-pause-home-preview-snapshot-types';

type PendingOfferLike = {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
};

/** Optimistic Home preview after C′ discard — pending row becomes open `active` (Mode B). */
export function buildOpenPausePreviewFromPendingOffer(
  pending: PendingOfferLike,
): OpenPauseHomePreviewSnapshotSource {
  const contextSnapshot = pending.context_snapshot ?? null;
  const contextText =
    contextSnapshot && typeof contextSnapshot.context_text === 'string'
      ? contextSnapshot.context_text
      : null;
  const source =
    contextSnapshot && typeof contextSnapshot.source === 'string'
      ? contextSnapshot.source
      : null;

  return {
    message: null,
    context: contextText,
    companions: DEFAULT_COMPANIONS,
    lastPauseInstanceId: pending.id,
    openPauseState: 'active',
    openPauseSource: source,
    contextSnapshot,
    hasReflectionStep: false,
    hasOpenPauseStepEvents: false,
    hasReachedReflect: false,
    isBriefRitual: false,
    openPauseCreatedAt: pending.created_at,
    openPauseEngagedAt: null,
    openPauseMetadata: null,
  };
}
