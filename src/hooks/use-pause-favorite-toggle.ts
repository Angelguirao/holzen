import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { hapticFeedback } from '@/lib/haptics';
import { pauseLogStep } from '@/lib/pause-api';
import { showPauseFavoriteProHintToast } from '@/lib/pause-favorite-toast';

export function usePauseFavoriteToggle(input: {
  pauseInstanceId: string | null;
  isFavorite: boolean;
  setIsFavorite: Dispatch<SetStateAction<boolean>>;
  subscribed: boolean;
  t: TFunction;
}): { toggleFavorite: () => Promise<void> } {
  const { pauseInstanceId, isFavorite, setIsFavorite, subscribed, t } = input;

  const toggleFavorite = useCallback(async () => {
    if (!pauseInstanceId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    await pauseLogStep({
      instanceId: pauseInstanceId,
      stepType: 'favorite_toggled',
      payload: { is_favorite: newVal },
    }).catch(() => setIsFavorite(!newVal));
    if (newVal && !subscribed) {
      showPauseFavoriteProHintToast(t);
    }
  }, [pauseInstanceId, isFavorite, subscribed, t, setIsFavorite]);

  return { toggleFavorite };
}
