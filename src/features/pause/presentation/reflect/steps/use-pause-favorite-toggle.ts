import { useCallback, useOptimistic } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useAuth } from '@/features/auth/public';
import { pauseArchiveListQueryPrefix } from '@/features/pause/public-queries';
import {
  pauseReflectFavoriteToggle,
  shouldShowFavoriteProHint,
  showPauseFavoriteProHintToast,
} from './pause-reflect-steps-io';
import { hapticFeedback } from '@/lib/haptics';

export function usePauseFavoriteToggle(input: {
  pauseInstanceId: string | null;
  isFavoriteCommitted: boolean;
  addOptimisticFavorite: (next: boolean) => void;
  setIsFavorite: (value: boolean) => void;
  subscribed: boolean;
  t: TFunction;
}): { toggleFavorite: () => Promise<void> } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    pauseInstanceId,
    isFavoriteCommitted,
    addOptimisticFavorite,
    setIsFavorite,
    subscribed,
    t,
  } = input;

  const toggleFavorite = useCallback(async () => {
    if (!pauseInstanceId) return;
    const attempted = !isFavoriteCommitted;
    addOptimisticFavorite(attempted);
    hapticFeedback('light');

    const outcome = await pauseReflectFavoriteToggle({
      pauseInstanceId,
      isFavorite: isFavoriteCommitted,
    });
    if (outcome.status === 'no_instance') return;

    if (outcome.status === 'sync_failed') {
      setIsFavorite(!outcome.attemptedValue);
      return;
    }

    setIsFavorite(outcome.newValue);
    if (user?.id) {
      void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
    }
    if (shouldShowFavoriteProHint(outcome.newValue, subscribed)) {
      showPauseFavoriteProHintToast(t);
    }
  }, [
    pauseInstanceId,
    isFavoriteCommitted,
    addOptimisticFavorite,
    setIsFavorite,
    subscribed,
    t,
    user?.id,
    queryClient,
  ]);

  return { toggleFavorite };
}
