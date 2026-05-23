/**
 * Application-layer I/O parity for session persisted-tab cluster (parity with
 * `pause-session-ritual-restore-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-persisted-tab-session-io.ts`).
 * Imports `pause-session-persisted-tab-session-flow` CI umbrella for `.toBe` identity pins only —
 * production tab-session I/O keeps `persisted-tab-session` leaf import.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  persistedTabSessionStorage: { port: 'persistedTabSessionStorage' },
}));

vi.mock('@/features/pause/application/use-cases/session/persisted-tab-session', () => ({
  clearPersistedTabSession: vi.fn(),
  loadPersistedTabSession: vi.fn(() => null),
  savePersistedTabSession: vi.fn(),
}));

import {
  clearPersistedTabSession as clearDirect,
  clearPersistedTabSession,
  loadPersistedTabSession as loadDirect,
  loadPersistedTabSession,
  savePersistedTabSession as saveDirect,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/persisted-tab-session';
import {
  clearPersistedTabSession as clearFromFlow,
  loadPersistedTabSession as loadFromFlow,
  savePersistedTabSession as saveFromFlow,
} from './pause-session-persisted-tab-session-flow';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { persistedTabSessionStorage } from '@/features/pause/public-rpc';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

describe('pause-session-persisted-tab-session-io parity (application)', () => {
  it('presentation tab-session I/O delegates load/save/clear to persisted-tab-session with default port', () => {
    const data = { step: 'brief' } as unknown as PersistedSession;
    vi.mocked(loadPersistedTabSession).mockReturnValue(data);

    expect(loadPausePersistedTabSession()).toBe(data);
    expect(loadPersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage);

    savePausePersistedTabSession(data);
    expect(savePersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage, data);

    clearPausePersistedTabSession();
    expect(clearPersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage);
  });

  it('persisted-tab-session-flow CI umbrella composes the same leaf use cases as presentation bindings', () => {
    expect(loadPersistedTabSession).toBe(loadDirect);
    expect(savePersistedTabSession).toBe(saveDirect);
    expect(clearPersistedTabSession).toBe(clearDirect);
    expect(loadFromFlow).toBe(loadDirect);
    expect(saveFromFlow).toBe(saveDirect);
    expect(clearFromFlow).toBe(clearDirect);
  });

  it('presentation I/O exports port-bound tab-session helpers (not raw use-case re-exports)', () => {
    expect(typeof loadPausePersistedTabSession).toBe('function');
    expect(typeof savePausePersistedTabSession).toBe('function');
    expect(typeof clearPausePersistedTabSession).toBe('function');
    expect(loadPausePersistedTabSession).not.toBe(loadDirect);
    expect(savePausePersistedTabSession).not.toBe(saveDirect);
    expect(clearPausePersistedTabSession).not.toBe(clearDirect);
    expect(loadPausePersistedTabSession).not.toBe(loadPersistedTabSession);
  });
});
