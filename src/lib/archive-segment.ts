import { isMainPauseLibraryBookmark } from '@/lib/normalize-library-source-type';

export type ArchiveMainSegment = 'pauses' | 'echoes' | 'collections';

/** Terminal outcomes that can happen without ever entering Reflect (`engaged_at` still null). */
const ECHO_ELIGIBLE_STATES = new Set(['expired', 'dismissed']);

export type PauseInstanceArchiveMeta = {
  state: string;
  /** ISO timestamp from `pause_instances.engaged_at`; null = user never entered Reflect for this pause. */
  engaged_at: string | null;
};

export type PauseInstanceArchiveMetaGetter = (
  pauseId: string | null,
) => PauseInstanceArchiveMeta | undefined;

/**
 * Archive “echo”: main pause row for an instance that ended dismissed/expired
 * without `engaged_at` (never opened Reflect). `completed` always implies
 * engagement in the DB and never counts as an echo.
 */
export function isArchiveEchoPause(meta: PauseInstanceArchiveMeta): boolean {
  if (!ECHO_ELIGIBLE_STATES.has(meta.state)) return false;
  return meta.engaged_at == null;
}

export function itemBelongsToEchoesTab(
  item: { source_type: string | null; pause_instance_id: string | null },
  getPauseArchiveMeta: PauseInstanceArchiveMetaGetter,
): boolean {
  if (!item.pause_instance_id || !isMainPauseLibraryBookmark(item.source_type)) return false;
  const meta = getPauseArchiveMeta(item.pause_instance_id);
  return !!meta && isArchiveEchoPause(meta);
}

export function itemBelongsToPausesTab(
  item: { source_type: string | null; pause_instance_id: string | null },
  getPauseArchiveMeta: PauseInstanceArchiveMetaGetter,
): boolean {
  if (itemBelongsToEchoesTab(item, getPauseArchiveMeta)) return false;
  if (item.pause_instance_id && !isMainPauseLibraryBookmark(item.source_type)) {
    const meta = getPauseArchiveMeta(item.pause_instance_id);
    if (meta && isArchiveEchoPause(meta)) return false;
  }
  return true;
}
