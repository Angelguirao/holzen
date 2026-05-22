/**
 * CI cluster anchor for session shell chrome (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation I/O imports.
 * Presentation: `pause-session-shell-io.ts` imports sibling modules directly (not this umbrella).
 * Parity pins: `pause-session-shell-io.re-exports.test.ts` and `pause-session-shell-io-parity.test.ts`.
 * Sibling cluster: `pause-session-terminal-entry-shell-flow-sibling-parity.test.ts` ↔ `pause-session-terminal-entry-flow`;
 * `pause-session-scaffold-shell-flow-sibling-parity.test.ts` ↔ `pause-session-scaffold-flow`.
 */
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
} from './hydration';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from './header-back';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './mount-log-params';
export { coalescePauseSessionShellViewModel } from './shell-view-model';
export { hasPersistedPauseSessionPayload } from '@/features/pause/domain/session/persisted-session-guards';
export { isPauseSessionWaitingForInstanceFetch } from '@/features/pause/domain/session/waiting-for-instance-fetch';
