import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useAuth } from '@/features/auth/public';
import { pauseArchiveListQueryPrefix, showPauseFavoriteProHintToast } from '@/features/pause/public';
import { shouldShowFavoriteProHint } from '@/features/pause/application/use-cases/ritual/reflect/run-pause-favorite-toggle';
import { logPauseFavoriteToggle } from '@/features/pause/public-rpc';
import { hapticFeedback } from '@/lib/haptics';

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
    const optimisticNext = !isFavorite;
    setIsFavorite(optimisticNext);
    hapticFeedback('light');

    const outcome = await logPauseFavoriteToggle({ pauseInstanceId, isFavorite });
    if (outcome.status === 'no_instance') return;

    if (outcome.status === 'sync_failed') {
      setIsFavorite(!outcome.attemptedValue);
      return;
    }

    if (user?.id) {
      void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
    }
    if (shouldShowFavoriteProHint(outcome.newValue, subscribed)) {
      showPauseFavoriteProHintToast(t);
    }
  }, [pauseInstanceId, isFavorite, subscribed, t, setIsFavorite, user?.id, queryClient]);

  return { toggleFavorite };
}
