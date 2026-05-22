/**
 * CI cluster anchor for session scaffold presentation I/O (§3 / check:architecture-alignment).
 * Re-exports persist snapshot, storage ritual sync, and scaffold derived VM helpers.
 * Presentation: `pause-session-scaffold-io.ts` imports subcluster modules directly (off this umbrella).
 * Sibling CI anchor: `pause-session-shell-flow.ts` (hydration/header-back/shell VM — distinct exports).
 * Sibling pins: `pause-session-scaffold-flow.test.ts` ↔ `pause-session-shell-flow.test.ts` and
 * `pause-session-providers-flow.test.ts` (inline);
 * `pause-session-scaffold-shell-flow-sibling-parity.test.ts` ↔ `pause-session-shell-flow`;
 * `pause-session-providers-scaffold-flow-sibling-parity.test.ts` ↔ `pause-session-providers-flow`.
 * Parity pins: `pause-session-scaffold-io-parity.test.ts` (presentation sibling distinctness vs shell-io +
 * persisted-tab-session flow + persistable-anchor behavioral pin), `pause-session-scaffold-io.re-exports.test.ts`.
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
export { hasPersistablePauseSessionAnchor } from '@/features/pause/domain/session/persisted-session-guards';
