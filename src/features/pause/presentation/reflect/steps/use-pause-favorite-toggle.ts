import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useAuth } from '@/features/auth/public';
import { showPauseFavoriteProHintToast } from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-pro-hint-toast';
import { pauseArchiveListQueryPrefix } from '@/features/pause/public-queries';
import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
import { runPauseFavoriteToggle } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { supabasePauseRepository } from '@/features/pause/public-ports';
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

    const outcome = await runPauseFavoriteToggle(supabasePauseRepository, {
      pauseInstanceId,
      isFavorite,
    });
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
