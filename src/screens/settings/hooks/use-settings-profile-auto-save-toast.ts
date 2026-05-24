import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Debounced "Saved" toast when Holzen profile fields change (after initial load).
 */
export function useSettingsProfileAutoSaveToast(
  profileLoaded: boolean,
  profileSaveKey: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
) {
  const initialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!profileLoaded) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      toast(t('settings.saved', { defaultValue: 'Saved' }), { duration: 1200, id: 'auto-save' });
    }, 400);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [profileLoaded, profileSaveKey, t]);
}
