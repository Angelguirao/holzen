import type { TFunction } from 'i18next';
import { normalizeLibrarySourceType } from '@/features/pause/domain/normalize-library-source-type';

/**
 * Localized label for a library item `source_type` (keys under `librarySources` in i18n).
 */
export function librarySourceLabel(
  sourceType: string | undefined,
  t: TFunction,
  whenMissing: string
): string {
  const key = normalizeLibrarySourceType(sourceType);
  if (!key) return whenMissing;
  return t(`librarySources.${key}`, { defaultValue: whenMissing });
}
