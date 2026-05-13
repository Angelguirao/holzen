import { useQuery } from '@tanstack/react-query';
import {
  getPauseSessionCompanionSnapshotQueryOptions,
  type PauseSessionSnapshot,
} from '@/lib/pause-page-loader';

/**
 * TanStack-backed load for companion full-view routes (`/companions/.../:pauseInstanceId`).
 */
export function usePauseSessionCompanionSnapshot(pauseInstanceId: string | undefined): {
  snapshot: PauseSessionSnapshot | null;
  isPending: boolean;
  loadError: boolean;
} {
  const { data: snapshot, isPending, isSuccess, isError } = useQuery(
    getPauseSessionCompanionSnapshotQueryOptions(pauseInstanceId),
  );

  const loadError =
    Boolean(pauseInstanceId) && !isPending && (isError || (isSuccess && snapshot === null));

  return { snapshot: snapshot ?? null, isPending, loadError };
}
