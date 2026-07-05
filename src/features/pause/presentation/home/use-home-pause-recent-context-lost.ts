import { useQuery } from '@tanstack/react-query';
import {
  CONTEXT_LOST_HOME_WINDOW_MS,
  fetchRecentContextLostPause,
} from '@/features/pause/public-queries';
import { useCalmWatersToast } from '@/features/pause/presentation/home/use-calm-waters-toast';

/** Calm-waters toast eligibility — recent cron `context_lost` within Home window. */
export function useHomePauseRecentContextLost(input: {
  userId: string | undefined;
  hasOpenPause: boolean;
}) {
  const calmQuery = useQuery({
    queryKey: ['home-recent-context-lost', input.userId],
    queryFn: () => fetchRecentContextLostPause(input.userId!),
    enabled: Boolean(input.userId) && !input.hasOpenPause,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const showCalmWaters = Boolean(
    !input.hasOpenPause &&
      calmQuery.data &&
      Date.now() - new Date(calmQuery.data.expiredAt).getTime() < CONTEXT_LOST_HOME_WINDOW_MS,
  );

  useCalmWatersToast({
    userId: input.userId,
    showCalmWaters,
    pauseInstanceId: calmQuery.data?.pauseInstanceId ?? null,
  });

  return { calmQuery, showCalmWaters };
}
