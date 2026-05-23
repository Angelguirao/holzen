import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PersistedTabSessionStoragePort } from '@/features/pause/ports/persisted-tab-session-storage';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './persisted-tab-session';

describe('persisted-tab-session', () => {
  const storage: PersistedTabSessionStoragePort = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates load to the port', () => {
    const session = { pauseInstanceId: 'id-1' } as never;
    vi.mocked(storage.load).mockReturnValue(session);
    expect(loadPersistedTabSession(storage)).toBe(session);
    expect(storage.load).toHaveBeenCalledOnce();
  });

  it('delegates save to the port', () => {
    const session = { pauseInstanceId: 'id-2' } as never;
    savePersistedTabSession(storage, session);
    expect(storage.save).toHaveBeenCalledWith(session);
  });

  it('delegates clear to the port', () => {
    clearPersistedTabSession(storage);
    expect(storage.clear).toHaveBeenCalledOnce();
  });
});
