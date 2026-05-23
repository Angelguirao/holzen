import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Syncs the user's profile language preference with i18next.
 * Call once in a top-level layout component.
 */
export function useLanguageSync(language: string | undefined) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (language && i18n.language !== language) {
      // Only switch if we have the language loaded (en/es for now)
      const supported = Object.keys(i18n.options.resources || {});
      if (supported.includes(language)) {
        i18n.changeLanguage(language);
      }
    }
  }, [language, i18n]);
}
