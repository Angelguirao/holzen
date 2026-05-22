/**
 * CI cluster anchor for session scaffold presentation I/O (§3 / check:architecture-alignment).
 * Re-exports persist snapshot, storage ritual sync, and scaffold derived VM helpers.
 * Presentation: `pause-session-scaffold-io.ts` imports through this anchor (off deep session modules).
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
