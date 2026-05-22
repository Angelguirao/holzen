/**
 * Presentation I/O for `/pause` session scaffold (persist snapshot, storage ritual sync, derived VM).
 * Imports session scaffold use cases via `pause-session-scaffold-flow` CI anchor
 * (parity with `pause-session-brief-io` → brief flow).
 */
export {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  type PauseSessionPersistSnapshotInput,
  type PauseSessionScaffoldRitualDerived,
  type PauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/application/use-cases/session/pause-session-scaffold-flow';
