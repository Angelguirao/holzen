import { useProfile } from '@/hooks/use-profile';
import { useLanguageSync } from '@/app/hooks/use-language-sync';

/**
 * Profile fields the authenticated shell needs (header chrome, i18n).
 * Keeps `AppLayout` off `useHolzen` — Home owns pause/market orchestration.
 */
export function useShellProfile() {
  const { language, profileLoadError, retryProfileLoad } = useProfile();
  useLanguageSync(language);
  return { profileLoadError, retryProfileLoad };
}
