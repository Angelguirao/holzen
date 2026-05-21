/**
 * Tab session I/O for pause (no Supabase eager load).
 * Layout tokens and ritual step types: `public-hooks`. Domain gates: import `domain/*` directly.
 */
export type { PersistedSessionAnchor } from './domain/session/persisted-session-guards';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
