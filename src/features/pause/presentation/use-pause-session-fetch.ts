import { useQuery } from '@tanstack/react-query';
import { getPauseSessionFetchedInstanceQueryOptions } from '@/features/pause/public-queries';
import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';

/**
 * Loads `pause_instances` + `pause_ai_artifacts` when `/pause` opens with id-only navigation
 * (hydration `status === 'fetch'` from `computePauseSessionHydration`). Row shaping:
 * `buildFetchedPauseInstanceFromFetch` in the pause feature application layer.
 *
 * **Caller:** `features/pause/presentation/use-pause-session-shell.ts`. **Contract:** `docs/systems/pause-system.md`
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
