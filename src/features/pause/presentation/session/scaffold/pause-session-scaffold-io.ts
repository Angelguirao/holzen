/**
 * Presentation I/O for `/pause` session scaffold (persist snapshot, storage ritual sync, derived VM).
 * Scaffold conductors import here instead of deep `application/use-cases/session/*`.
 */
export {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  type PauseSessionPersistSnapshotInput,
  type PauseSessionScaffoldRitualDerived,
  type PauseStorageRitualSyncPatch,
} from '@/features/pause/application/use-cases/session/pause-session-scaffold-flow';
