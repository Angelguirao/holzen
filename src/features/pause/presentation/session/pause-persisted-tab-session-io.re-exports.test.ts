import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  persistedTabSessionStorage: { port: 'persistedTabSessionStorage' },
}));

import {
  clearPersistedTabSession as clearFromFlow,
  loadPersistedTabSession as loadFromFlow,
  savePersistedTabSession as saveFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  clearPersistedTabSession as clearDirect,
  loadPersistedTabSession as loadDirect,
  savePersistedTabSession as saveDirect,
} from '@/features/pause/application/use-cases/session/persisted-tab-session';

import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from './pause-persisted-tab-session-io';

describe('pause-persisted-tab-session-io re-exports', () => {
  it('persisted-tab-session-flow CI anchor composes persisted-tab-session leaf use cases', () => {
    expect(loadFromFlow).toBe(loadDirect);
    expect(saveFromFlow).toBe(saveDirect);
    expect(clearFromFlow).toBe(clearDirect);
  });

  it('presentation I/O bindings match pause-session-persisted-tab-session-flow CI anchor (leaf parity)', () => {
    expect(loadFromFlow).toBe(loadDirect);
    expect(saveFromFlow).toBe(saveDirect);
    expect(clearFromFlow).toBe(clearDirect);
  });

  it('presentation I/O exports port-bound helpers distinct from flow leaf re-exports', () => {
    expect(typeof loadPausePersistedTabSession).toBe('function');
    expect(typeof savePausePersistedTabSession).toBe('function');
    expect(typeof clearPausePersistedTabSession).toBe('function');
    expect(loadPausePersistedTabSession).not.toBe(loadDirect);
    expect(loadPausePersistedTabSession).not.toBe(loadFromFlow);
    expect(savePausePersistedTabSession).not.toBe(saveDirect);
    expect(savePausePersistedTabSession).not.toBe(saveFromFlow);
    expect(clearPausePersistedTabSession).not.toBe(clearDirect);
    expect(clearPausePersistedTabSession).not.toBe(clearFromFlow);
  });
});
