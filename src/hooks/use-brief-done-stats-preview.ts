import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import {
  computeBriefPauseStatsPreview,
  type BriefStatsPreview,
} from '@/lib/pause-brief-stats-preview';
import { getPauseStatsDataQueryOptions } from '@/lib/pause-stats-data-query';

export type BriefDoneStatsPreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error' }
  /** v_pause_full row not visible yet after retries (rare). */
  | { kind: 'sync_pending' }
  | { kind: 'ready'; preview: BriefStatsPreview };

const RETRY_DELAYS_MS = [0, 280, 520, 880] as const;

/**
 * Fetches fresh pause-stats bundle and compares `computePauseScore` with vs
 * without the completed instance — same formula as Journey / Home.
 */
export function useBriefDoneStatsPreview(params: {
  enabled: boolean;
  pauseInstanceId: string | null | undefined;
}): BriefDoneStatsPreviewState {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const holdGoalQ = useHoldGoalProfile();
  const [state, setState] = useState<BriefDoneStatsPreviewState>({ kind: 'idle' });

  useEffect(() => {
    if (!params.enabled || !userId || !params.pauseInstanceId) {
      setState({ kind: 'idle' });
      return;
    }

    if (!holdGoalQ.isFetched) {
      setState({ kind: 'loading' });
      return;
    }

    let cancelled = false;
    setState({ kind: 'loading' });

    const holdGoal = holdGoalQ.data ?? null;

    void (async () => {
      try {
        for (const delayMs of RETRY_DELAYS_MS) {
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
          if (cancelled) return;

          const payload = await queryClient.fetchQuery({
            ...getPauseStatsDataQueryOptions(userId),
          });

          const result = computeBriefPauseStatsPreview({
            payload,
            holdGoal,
            completedInstanceId: params.pauseInstanceId!,
          });

          if (result.status !== 'missing_instance_row') {
            if (!cancelled) setState({ kind: 'ready', preview: result });
            return;
          }
        }
        if (!cancelled) setState({ kind: 'sync_pending' });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    params.enabled,
    params.pauseInstanceId,
    userId,
    queryClient,
    holdGoalQ.isFetched,
    holdGoalQ.data,
  ]);

  return state;
}
