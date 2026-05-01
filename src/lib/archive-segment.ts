import { normalizeLibrarySourceType } from '@/lib/normalize-library-source-type';

/** Long-form companion reads — “Echoes” tab (wireframe: reflections at your own pace). */
const ECHO_SOURCE_TYPES = new Set(['history_insight', 'zoom_out']);

export type ArchiveMainSegment = 'pauses' | 'echoes' | 'collections';

export function librarySourceForSegment(item: { source_type: string | null }): string {
  return normalizeLibrarySourceType(item.source_type) ?? item.source_type ?? '';
}

export function itemBelongsToEchoesTab(item: { source_type: string | null }): boolean {
  return ECHO_SOURCE_TYPES.has(librarySourceForSegment(item));
}

export function itemBelongsToPausesTab(item: { source_type: string | null }): boolean {
  return !itemBelongsToEchoesTab(item);
}
