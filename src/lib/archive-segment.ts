import { isMainPauseLibraryBookmark } from '@/lib/normalize-library-source-type';

export type ArchiveMainSegment = 'pauses' | 'echoes' | 'collections';

/** Terminal rows that never reached DB `engaged` (`engaged_at` still null — early ritual gates not met). */
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
 * with `engaged_at` still null (never reached the `engaged` state milestone). That includes **`expired_reason =
 * superseded`** when the prior row was replaced before that milestone (adopted
 * pending, auto-supersede, etc.) — same “echo” bucket as other unengaged terminals.
 * `completed` always implies engagement in the DB and never counts as an echo.
 *
 * Pause archive lists are backed by `public.v_pause_archive_echoes` and
 * `public.v_pause_archive_pauses` (see migrations), not `library_items`.
 */
export function isArchiveEchoPause(meta: PauseInstanceArchiveMeta): boolean {
  if (!ECHO_ELIGIBLE_STATES.has(meta.state)) return false;
  if (meta.engaged_at != null) return false;
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
