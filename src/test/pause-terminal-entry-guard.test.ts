import { describe, it, expect } from 'vitest';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/lib/pause-terminal-entry-guard';
import type { PersistedSession } from '@/lib/pause-session-storage';

describe('pause-terminal-entry-guard', () => {
  it('TERMINAL_PAUSE_DB_STATES matches product states', () => {
    expect(TERMINAL_PAUSE_DB_STATES.has('completed')).toBe(true);
    expect(TERMINAL_PAUSE_DB_STATES.has('dismissed')).toBe(true);
    expect(TERMINAL_PAUSE_DB_STATES.has('expired')).toBe(true);
    expect(TERMINAL_PAUSE_DB_STATES.has('active')).toBe(false);
  });

  it('isTerminalPauseDbState', () => {
    expect(isTerminalPauseDbState('completed')).toBe(true);
    expect(isTerminalPauseDbState('engaged')).toBe(false);
    expect(isTerminalPauseDbState(null)).toBe(false);
  });

  it('persistedPauseSessionAllowsTerminalEntry requires matching id', () => {
    const saved = {
      message: 'hi',
      pauseInstanceId: 'a',
    } as unknown as PersistedSession;
    expect(persistedPauseSessionAllowsTerminalEntry(saved, 'a')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(saved, 'b')).toBe(false);
    expect(persistedPauseSessionAllowsTerminalEntry(saved, null)).toBe(false);
    expect(persistedPauseSessionAllowsTerminalEntry(null, 'a')).toBe(false);
  });
});
