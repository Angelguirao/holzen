/**
 * CI cluster anchor for session scaffold I/O (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation I/O imports.
 */
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './persist-snapshot';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './storage-ritual-sync';
export {
  buildPauseSessionScaffoldRitualDerived,
  type PauseSessionScaffoldRitualDerived,
} from './scaffold/scaffold-ritual-derived';
