/**
 * Presentation I/O for `/pause` session scaffold (persist snapshot, storage ritual sync, derived VM).
 * Imports session scaffold use cases directly instead of `pause-session-scaffold-flow` CI anchor.
 */
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from '@/features/pause/application/use-cases/session/persist-snapshot';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from '@/features/pause/application/use-cases/session/storage-ritual-sync';
export {
  buildPauseSessionScaffoldRitualDerived,
  type PauseSessionScaffoldRitualDerived,
} from '@/features/pause/application/use-cases/session/scaffold/scaffold-ritual-derived';
