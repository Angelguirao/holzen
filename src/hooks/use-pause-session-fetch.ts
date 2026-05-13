import { useQuery } from '@tanstack/react-query';
import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import { getPauseSessionFetchedInstanceQueryOptions } from '@/lib/pause-session-fetched-instance-query';

export { pauseSessionFetchedInstanceQueryKey } from '@/lib/pause-session-fetched-instance-query';

/**
 * Loads `pause_instances` + `pause_ai_artifacts` when `/pause` opens with id-only navigation
 * (hydration `status === 'fetch'` from `computePauseSessionHydration`). Row shaping:
 * `src/lib/pause-session-fetched-instance.ts`.
 *
 * **Caller:** `src/hooks/use-pause-session-shell.ts`. **Contract:** `docs/systems/pause-system.md`
 * section 7.2; **code map:** same doc, section 10.
 */
export function usePauseSessionFetch(fetchPauseInstanceId: string | null): {
  fetchedInstance: FetchedPauseInstance | null;
  fetchFailed: boolean;
} {
  const query = useQuery(getPauseSessionFetchedInstanceQueryOptions(fetchPauseInstanceId));

  const fetchedInstance =
    fetchPauseInstanceId && query.isSuccess && query.data ? query.data : null;
  const fetchFailed = Boolean(fetchPauseInstanceId && query.isError);

  return { fetchedInstance, fetchFailed };
}
