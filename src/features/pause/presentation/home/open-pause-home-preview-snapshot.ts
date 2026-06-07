import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

/** Local snapshot for Home discard undo — preview state before optimistic clear. */
export type OpenPauseHomePreviewSnapshot = {
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
  persistedSession: PersistedSession | null;
};

export type OpenPauseHomePreviewSnapshotSource = Omit<
  OpenPauseHomePreviewSnapshot,
  'persistedSession'
>;

export function captureOpenPauseHomePreviewSnapshot(
  source: OpenPauseHomePreviewSnapshotSource,
): OpenPauseHomePreviewSnapshot {
  return {
    ...source,
    persistedSession: loadPausePersistedTabSession(),
  };
}

export function restoreOpenPauseHomePreviewSnapshot(
  snapshot: OpenPauseHomePreviewSnapshot,
  apply: (snapshot: OpenPauseHomePreviewSnapshotSource) => void,
): void {
  const { persistedSession, ...preview } = snapshot;
  apply(preview);
  if (persistedSession) {
    savePausePersistedTabSession(persistedSession);
  } else {
    clearPausePersistedTabSession();
  }
}
