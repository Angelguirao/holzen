import type { OpenPauseHomePreviewSnapshotSource } from '@/features/pause/domain/home/open-pause-home-preview-snapshot-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';

export type { OpenPauseHomePreviewSnapshotSource } from '@/features/pause/domain/home/open-pause-home-preview-snapshot-types';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

/** Local snapshot for Home discard undo — preview state before optimistic clear. */
export type OpenPauseHomePreviewSnapshot = OpenPauseHomePreviewSnapshotSource & {
  persistedSession: PersistedSession | null;
};

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
