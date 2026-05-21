/**
 * Tab session I/O barrel for cross-context callers (re-exports use case).
 * Feature presentation imports `application/use-cases/session/persisted-tab-session` directly.
 * Layout tokens and ritual step types: `public-hooks`. Domain gates: import `domain/*` directly.
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
