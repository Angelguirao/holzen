import type { TFunction } from 'i18next';

/**
 * Localized label for a library item `source_type` (keys under `librarySources` in i18n).
 */
export function librarySourceLabel(
  sourceType: string | undefined,
  t: TFunction,
  whenMissing: string
): string {
  if (!sourceType) return whenMissing;
  return t(`librarySources.${sourceType}`, { defaultValue: whenMissing });
}
