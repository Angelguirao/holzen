import type { CompanionData } from '@/features/pause/domain/companion-card-types';

/** Optimistic Home preview shape (no persisted tab session). */
export type OpenPauseHomePreviewSnapshotSource = {
  message: string | null;
  context: string | null;
  companions: CompanionData;
  lastPauseInstanceId: string | null;
  openPauseState: 'active' | 'engaged' | null;
  openPauseSource: string | null;
  contextSnapshot: Record<string, unknown> | null;
  hasReflectionStep: boolean;
  hasOpenPauseStepEvents: boolean;
  hasReachedReflect: boolean;
  isBriefRitual: boolean;
  openPauseCreatedAt: string | null;
  openPauseEngagedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
};
