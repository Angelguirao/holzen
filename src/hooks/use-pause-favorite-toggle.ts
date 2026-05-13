import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useAuth } from '@/hooks/use-auth';
import { pauseArchiveListQueryPrefix } from '@/lib/pause-archive-list-query';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pauseInstanceId, isFavorite, setIsFavorite, subscribed, t } = input;

  const toggleFavorite = useCallback(async () => {
    if (!pauseInstanceId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'favorite_toggled',
        payload: { is_favorite: newVal },
      });
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
      }
      if (newVal && !subscribed) {
        showPauseFavoriteProHintToast(t);
      }
    } catch {
      setIsFavorite(!newVal);
    }
  }, [pauseInstanceId, isFavorite, subscribed, t, setIsFavorite, user?.id, queryClient]);

  return { toggleFavorite };
}
