/**
 * Tab session I/O barrel for cross-context callers (re-exports use case).
 * Feature presentation imports `presentation/session/pause-persisted-tab-session-io` (bound default port).
 * Ritual step layout tokens: `pauseStepLayout` (screens may import here instead of `public-hooks`).
 * Persist snapshot builder: `buildPauseSessionPersistSnapshot` (session scaffold presentation may import here).
 * Other session presentation: `public-hooks`. Domain gates: import `domain/*` directly.
 */
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './application/use-cases/session/persisted-tab-session';
import { persistedTabSessionStorage } from './infrastructure/persisted-tab-session-storage-adapter';

export type { PersistedSessionAnchor } from './domain/session/persisted-session-guards';

/** Cross-context tab session I/O (bound default adapter). */
export const loadSession = () => loadPersistedTabSession(persistedTabSessionStorage);
export const saveSession = (data: Parameters<typeof savePersistedTabSession>[1]) =>
  savePersistedTabSession(persistedTabSessionStorage, data);
export const clearSession = () => clearPersistedTabSession(persistedTabSessionStorage);

/** Shared ritual step chrome class tokens (Feel / Reflect / Frame / Decide). */
export { pauseStepLayout } from './presentation/session/pause-step-layout';

/** Tab autosave snapshot builder (session shell; presentation may import here). */
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/use-cases/session/persist-snapshot';
