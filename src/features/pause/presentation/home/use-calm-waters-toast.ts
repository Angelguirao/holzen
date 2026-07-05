import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  calmWatersToastId,
  hasShownCalmWatersToast,
  markCalmWatersToastShown,
} from './calm-waters-toast-io';

/**
 * One-shot Sonner when a cron offer expired with `context_lost` within the Home window.
 * Deduped per user + pause instance (survives widget collapse remounts and refetches).
 */
export function useCalmWatersToast(input: {
  userId: string | undefined;
  showCalmWaters: boolean;
  pauseInstanceId: string | null;
}): void {
  const { t } = useTranslation();
  const { userId, showCalmWaters, pauseInstanceId } = input;

  useEffect(() => {
    if (!userId || !showCalmWaters || !pauseInstanceId) return;
    if (hasShownCalmWatersToast(userId, pauseInstanceId)) return;

    markCalmWatersToastShown(userId, pauseInstanceId);
    toast.message(t('home.pauseCalmWaters.toast'), {
      duration: 5000,
      id: calmWatersToastId(pauseInstanceId),
    });
  }, [userId, showCalmWaters, pauseInstanceId, t]);
}
