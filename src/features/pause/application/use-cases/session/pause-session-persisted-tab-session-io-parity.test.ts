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
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/persisted-tab-session';
import {
  clearPersistedTabSession as clearFromFlow,
  loadPersistedTabSession as loadFromFlow,
  savePersistedTabSession as saveFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { persistedTabSessionStorage } from '@/features/pause/public-rpc';
import type { PersistedSession } from '@/features/pause/domain/session-model';

describe('pause-session-persisted-tab-session-io parity', () => {
  it('presentation I/O delegates tab session load/save/clear to persisted-tab-session with default port', () => {
    const data = { step: 'brief' } as unknown as PersistedSession;
    vi.mocked(loadPersistedTabSession).mockReturnValue(data);

    expect(loadPausePersistedTabSession()).toBe(data);
    expect(loadPersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage);

    savePausePersistedTabSession(data);
    expect(savePersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage, data);

    clearPausePersistedTabSession();
    expect(clearPersistedTabSession).toHaveBeenCalledWith(persistedTabSessionStorage);
  });

  it('persisted-tab-session-flow CI umbrella re-exports the same leaf use cases as presentation I/O path', () => {
    expect(loadFromFlow).toBe(loadPersistedTabSession);
    expect(saveFromFlow).toBe(savePersistedTabSession);
    expect(clearFromFlow).toBe(clearPersistedTabSession);
  });
});
