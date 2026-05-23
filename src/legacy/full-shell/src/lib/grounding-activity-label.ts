import type { TFunction } from 'i18next';

/** Display label for a grounding activity tag (preset i18n or raw tag). */
export function groundingActivityLabel(tag: string, t: TFunction): string {
  const key = `settings.grounding.${tag}`;
  const translated = t(key);
  return translated !== key ? translated : tag;
}
