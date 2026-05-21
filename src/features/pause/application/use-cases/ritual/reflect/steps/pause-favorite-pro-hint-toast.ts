import type { TFunction } from 'i18next';
import { toast } from 'sonner';

/** Non-error hint when favoriting a pause while not subscribed. */
export function showPauseFavoriteProHintToast(t: TFunction): void {
  toast(t('pause.favoriteProHint'), { duration: 4000 });
}
