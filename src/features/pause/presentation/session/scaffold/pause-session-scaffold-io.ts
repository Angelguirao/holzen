/**
 * Presentation I/O for `/pause` session scaffold (persist snapshot, storage ritual sync, derived VM).
 * Scaffold conductors import here instead of deep `application/use-cases/session/*`.
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
