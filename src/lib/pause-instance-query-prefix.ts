/**
 * First segment of TanStack keys scoped to a `pause_instances.id` (per-instance
 * keys append the UUID; see {@link pauseInstanceQueryPrefix}).
 */
export const PAUSE_INSTANCE_QUERY_ROOT = ['pause-instance'] as const;

/**
 * Shared prefix for TanStack Query keys scoped to a `pause_instances.id`
 * (e.g. {@link companionLibraryFavoritesQueryKey}).
 * Use with `invalidateQueries` to drop all cache entries for that instance.
 */
export function pauseInstanceQueryPrefix(pauseInstanceId: string) {
  return [...PAUSE_INSTANCE_QUERY_ROOT, pauseInstanceId] as const;
}
