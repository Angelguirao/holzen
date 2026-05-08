/**
 * Shared prefix for TanStack Query keys scoped to a `pause_instances.id`
 * (e.g. {@link companionLibraryFavoritesQueryKey}).
 * Use with `invalidateQueries` to drop all cache entries for that instance.
 */
export function pauseInstanceQueryPrefix(pauseInstanceId: string) {
  return ['pause-instance', pauseInstanceId] as const;
}
