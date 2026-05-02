import { isMainPauseLibraryBookmark } from '@/lib/normalize-library-source-type';

export type ArchiveMainSegment = 'pauses' | 'echoes' | 'collections';

/** Terminal outcomes that can happen without ever entering Reflect (`engaged_at` still null). */
const ECHO_ELIGIBLE_STATES = new Set(['expired', 'dismissed']);

export type PauseInstanceArchiveMeta = {
  state: string;
  /** ISO timestamp from `pause_instances.engaged_at`; null = user never entered Reflect for this pause. */
  engaged_at: string | null;
  /** Set when `state = expired` (e.g. `superseded` when user adopted a pending pause). */
  expired_reason?: string | null;
  /** From `v_pause_full` — used for archive card summaries. */
  has_breath_completed?: boolean;
  /** Companion types that counted toward this pause (from `v_pause_full`). */
  counted_companion_types?: string[] | null;
};

export type PauseInstanceArchiveMetaGetter = (
  pauseId: string | null,
) => PauseInstanceArchiveMeta | undefined;

/**
 * Archive “echo”: main pause row for an instance that ended dismissed/expired
 * without `engaged_at` (never opened Reflect). `completed` always implies
 * engagement in the DB and never counts as an echo.
 *
 * `expired_reason = superseded` (prior open pause when adopting pending) is **not**
 * an echo — it stays on the Pauses archive tab per `library_archive_pauses_tab_items`.
 *
 * Server mirrors: `public.library_archive_echo_items` (Echo tab list + pagination),
 * `public.library_archive_pauses_tab_items` (Pauses tab list + pagination; excludes
 * echo-only instances). Both views may include synthetic `pause` rows when a terminal
 * instance has no `library_items` rows (`source_library_item_id` is null in SQL).
 */
export function isArchiveEchoPause(meta: PauseInstanceArchiveMeta): boolean {
  if (!ECHO_ELIGIBLE_STATES.has(meta.state)) return false;
  if (meta.engaged_at != null) return false;
  if (meta.expired_reason === 'superseded') return false;
  return true;
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
