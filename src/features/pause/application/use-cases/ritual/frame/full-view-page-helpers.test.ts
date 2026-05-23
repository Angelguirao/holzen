import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS } from '@/features/pause/domain/session-model';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from './full-view-page-helpers';

describe('pauseSeverityToOrchestrateNumber', () => {
  it('maps severity labels for orchestrate payloads', () => {
    expect(pauseSeverityToOrchestrateNumber('mild')).toBe(3);
    expect(pauseSeverityToOrchestrateNumber('moderate')).toBe(6);
    expect(pauseSeverityToOrchestrateNumber('high')).toBe(10);
  });
});

describe('companionPrefsForFullViewSlot', () => {
  it('enables only the requested slot flag', () => {
    expect(companionPrefsForFullViewSlot(DEFAULT_PREFS, 'signal').signal).toBe(true);
    expect(companionPrefsForFullViewSlot(DEFAULT_PREFS, 'grounding').grounding).toBe(true);
    expect(companionPrefsForFullViewSlot(DEFAULT_PREFS, 'history').history).toBe(true);
    expect(companionPrefsForFullViewSlot(DEFAULT_PREFS, 'zoomOut').zoomOut).toBe(true);
  });
});

describe('isCompanionFullViewSlotSettled', () => {
  const empty = {
    signal: null,
    signalLoading: false,
    signalError: null,
    nudge: null,
    nudgeLoading: false,
    nudgeError: null,
    historyInsight: null,
    historyLoading: false,
    historyError: null,
    zoomOut: null,
    zoomOutLoading: false,
    zoomOutError: null,
  };

  it('returns false when slot has no data, loading, or error', () => {
    expect(isCompanionFullViewSlotSettled('signal', empty)).toBe(false);
  });

  it('returns true when slot is loading', () => {
    expect(isCompanionFullViewSlotSettled('history', { ...empty, historyLoading: true })).toBe(true);
  });
});

describe('COMPANION_FULL_VIEW_BREATHING_ROOM_MS', () => {
  it('matches full-view UX constant', () => {
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe(8000);
  });
});
