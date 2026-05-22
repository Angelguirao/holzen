/**
 * Presentation I/O for `/pause` shell chrome (hydration, header back, mount log, shell VM).
 * Imports session shell use cases via sibling application modules
 * (parity with `pause-reflect-hub-io` → hub subcluster flows).
 * CI: `pause-session-shell-io-parity.test.ts` (umbrella/leaf identity),
 * `pause-session-shell-io.re-exports.test.ts`, `pause-session-shell-io.test.ts` (wrapper delegation pins),
 * `pause-session-scaffold-shell-io-sibling-parity.test.ts` (application sibling vs scaffold-io),
 * `pause-session-shell-scaffold-io-sibling-parity.test.ts` (presentation sibling vs scaffold-io),
 * `pause-session-providers-shell-io-sibling-parity.test.ts` (sibling vs providers-io),
 * `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` (sibling vs terminal-entry-io).
 */
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
} from '@/features/pause/application/use-cases/session/hydration';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from '@/features/pause/application/use-cases/session/header-back';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from '@/features/pause/application/use-cases/session/mount-log-params';
export { coalescePauseSessionShellViewModel } from '@/features/pause/application/use-cases/session/shell-view-model';
export { hasPersistedPauseSessionPayload } from '@/features/pause/domain/session/persisted-session-guards';
export { isPauseSessionWaitingForInstanceFetch } from '@/features/pause/domain/session/waiting-for-instance-fetch';
