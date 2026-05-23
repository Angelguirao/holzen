import type { Collection, CollectionItem } from '@/legacy/archive-collections/domain/library-bundle';

export function hasCollectionMembership(
  collectionItems: CollectionItem[],
  collectionId: string,
  pauseInstanceId: string,
): boolean {
  return collectionItems.some(
    (ci) => ci.collection_id === collectionId && ci.pause_instance_id === pauseInstanceId,
  );
}

export function nextCollectionItemPosition(collectionItems: CollectionItem[], collectionId: string): number {
  const maxPos = collectionItems
    .filter((ci) => ci.collection_id === collectionId)
    .reduce((max, ci) => Math.max(max, ci.position), -1);
  return maxPos + 1;
}

export function sortedPauseInstanceIdsInCollection(
  collectionItems: CollectionItem[],
  collectionId: string,
): string[] {
  return collectionItems
    .filter((ci) => ci.collection_id === collectionId)
    .sort((a, b) => a.position - b.position)
    .map((ci) => ci.pause_instance_id);
}

export function countCollectionItems(collectionItems: CollectionItem[], collectionId: string): number {
  return collectionItems.filter((ci) => ci.collection_id === collectionId).length;
}

export function collectionsContainingPauseInstance(
  collections: Collection[],
  collectionItems: CollectionItem[],
  pauseInstanceId: string,
): Collection[] {
  const colIds = collectionItems
    .filter((ci) => ci.pause_instance_id === pauseInstanceId)
    .map((ci) => ci.collection_id);
  return collections.filter((c) => colIds.includes(c.id));
}
