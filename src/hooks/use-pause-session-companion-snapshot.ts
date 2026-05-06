import { useQuery } from '@tanstack/react-query';
import {
  loadPauseSessionSnapshot,
  pauseSessionCompanionSnapshotQueryKey,
  type PauseSessionSnapshot,
} from '@/lib/pause-page-loader';

const SNAPSHOT_QUERY_DISABLED_KEY = ['pause', 'companion-fullview', 'snapshot', 'none'] as const;

/**
 * TanStack-backed load for companion full-view routes (`/companions/.../:pauseInstanceId`).
 */
export function usePauseSessionCompanionSnapshot(pauseInstanceId: string | undefined): {
  snapshot: PauseSessionSnapshot | null;
  isPending: boolean;
  loadError: boolean;
} {
  const { data: snapshot, isPending, isSuccess, isError } = useQuery({
    queryKey: pauseInstanceId
      ? pauseSessionCompanionSnapshotQueryKey(pauseInstanceId)
      : SNAPSHOT_QUERY_DISABLED_KEY,
    queryFn: () => loadPauseSessionSnapshot(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loadError =
    Boolean(pauseInstanceId) && !isPending && (isError || (isSuccess && snapshot === null));

  return { snapshot: snapshot ?? null, isPending, loadError };
}
