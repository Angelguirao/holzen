import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPauseSessionCompanionSnapshotQueryOptions,
  pauseSessionCompanionSnapshotQueryKey,
  type PauseSessionSnapshot,
} from '@/features/pause/public-queries';
import { usePauseAiArtifactsRealtime } from '@/features/pause/presentation/realtime/use-pause-ai-artifacts-realtime';

/**
 * TanStack-backed load for companion full-view routes (`/companions/.../:pauseInstanceId`).
 */
export function usePauseSessionCompanionSnapshot(pauseInstanceId: string | undefined): {
  snapshot: PauseSessionSnapshot | null;
  isPending: boolean;
  loadError: boolean;
} {
  const queryClient = useQueryClient();

  const invalidateSnapshot = useCallback(() => {
    if (!pauseInstanceId) return;
    void queryClient.invalidateQueries({
      queryKey: pauseSessionCompanionSnapshotQueryKey(pauseInstanceId),
    });
  }, [pauseInstanceId, queryClient]);

  usePauseAiArtifactsRealtime(
    pauseInstanceId,
    pauseInstanceId ? `companion-artifacts-${pauseInstanceId}` : 'companion-artifacts-none',
    invalidateSnapshot,
  );

  const { data: snapshot, isPending, isSuccess, isError } = useQuery(
    getPauseSessionCompanionSnapshotQueryOptions(pauseInstanceId),
  );

  const loadError =
    Boolean(pauseInstanceId) && !isPending && (isError || (isSuccess && snapshot === null));

  return { snapshot: snapshot ?? null, isPending, loadError };
}
