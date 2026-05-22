/**
 * Presentation I/O for `/pause` session scaffold (persist snapshot, storage ritual sync, derived VM).
 * Imports session scaffold use cases via sibling application modules
 * (parity with `pause-session-shell-io` → shell subcluster modules).
 * CI: `pause-session-scaffold-io-parity.test.ts` (umbrella/leaf identity + sibling distinctness vs
 * `pause-session-shell-io` / persisted-tab-session flow), `pause-session-scaffold-io.re-exports.test.ts`,
 * `pause-session-scaffold-io.test.ts` (presentation smoke + leaf identity),
 * `pause-session-scaffold-shell-io-sibling-parity.test.ts` (sibling vs shell-io),
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts` (sibling vs providers-io),
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` (sibling vs terminal-entry-io).
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
export { hasPersistablePauseSessionAnchor } from '@/features/pause/domain/session/persisted-session-guards';
