import { describe, expect, it, vi } from 'vitest';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from './pause-persisted-tab-session-io';

const clearPersistedTabSessionMock = vi.hoisted(() => vi.fn());
const loadPersistedTabSessionMock = vi.hoisted(() => vi.fn());
const savePersistedTabSessionMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow',
  () => ({
    clearPersistedTabSession: clearPersistedTabSessionMock,
    loadPersistedTabSession: loadPersistedTabSessionMock,
    savePersistedTabSession: savePersistedTabSessionMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  persistedTabSessionStorage: { port: 'persistedTabSessionStorage' },
}));

describe('pause-persisted-tab-session-io', () => {
  it('re-exports tab session helpers from pause-session-persisted-tab-session-flow', () => {
    expect(typeof loadPausePersistedTabSession).toBe('function');
    expect(typeof savePausePersistedTabSession).toBe('function');
    expect(typeof clearPausePersistedTabSession).toBe('function');
  });

  it('binds load through the default persisted tab session port', () => {
    loadPersistedTabSessionMock.mockReturnValue({ step: 'brief' });
    expect(loadPausePersistedTabSession()).toEqual({ step: 'brief' });
    expect(loadPersistedTabSessionMock).toHaveBeenCalledWith({
      port: 'persistedTabSessionStorage',
    });
  });
});
