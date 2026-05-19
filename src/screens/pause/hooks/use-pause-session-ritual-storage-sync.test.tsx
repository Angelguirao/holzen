import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePauseSessionRitualStorageSync } from '@/screens/pause/hooks/use-pause-session-ritual-storage-sync';
import { type PersistedSession } from '@/features/pause/public';

const { loadSessionMock } = vi.hoisted(() => ({
  loadSessionMock: vi.fn(),
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  loadSession: () => loadSessionMock(),
}));

const companions = { haiku: null, groundingTitle: null, groundingBody: null } as const;
const companionPrefs = {
  breathing: true,
  haiku: true,
  grounding: true,
  signal: true,
  zoomOut: true,
  history: true,
} as const;

function minimalSession(over: Partial<PersistedSession> = {}): PersistedSession {
  return {
    message: 'hi',
    context: null,
    pauseInstanceId: 'pi-1',
    companions,
    companionPrefs,
    severity: 'mild',
    moodDone: true,
    moodAfterDone: false,
    phase: 'session',
    decision: null,
    step: 'feel',
    pauseRitualSchema: 4,
    ritualDepth: 'brief',
    briefStep: 'decide',
    briefIntegrateDone: true,
    briefFace: null,
    ...over,
  };
}

describe('usePauseSessionRitualStorageSync', () => {
  beforeEach(() => {
    loadSessionMock.mockReset();
  });

  it('does not read storage when pauseInstanceId is null', () => {
    const setRitualEntry = vi.fn();
    renderHook(() =>
      usePauseSessionRitualStorageSync({
        pauseInstanceId: null,
        setRitualEntry,
        setBriefStep: vi.fn(),
        setBriefIntegrateDone: vi.fn(),
        setSelectedBriefFace: vi.fn(),
      }),
    );
    expect(loadSessionMock).not.toHaveBeenCalled();
    expect(setRitualEntry).not.toHaveBeenCalled();
  });

  it('applies patch when storage matches pauseInstanceId', () => {
    loadSessionMock.mockReturnValue(minimalSession());
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    const setBriefIntegrateDone = vi.fn();
    const setSelectedBriefFace = vi.fn();
    renderHook(() =>
      usePauseSessionRitualStorageSync({
        pauseInstanceId: 'pi-1',
        setRitualEntry,
        setBriefStep,
        setBriefIntegrateDone,
        setSelectedBriefFace,
      }),
    );
    expect(setRitualEntry).toHaveBeenCalledWith('brief');
    expect(setBriefStep).toHaveBeenCalledWith('decide');
    expect(setBriefIntegrateDone).toHaveBeenCalledWith(true);
    expect(setSelectedBriefFace).toHaveBeenCalledWith(null);
  });

  it('does not apply when saved session belongs to another instance', () => {
    loadSessionMock.mockReturnValue(minimalSession({ pauseInstanceId: 'other' }));
    const setRitualEntry = vi.fn();
    renderHook(() =>
      usePauseSessionRitualStorageSync({
        pauseInstanceId: 'pi-1',
        setRitualEntry,
        setBriefStep: vi.fn(),
        setBriefIntegrateDone: vi.fn(),
        setSelectedBriefFace: vi.fn(),
      }),
    );
    expect(setRitualEntry).not.toHaveBeenCalled();
  });
});
