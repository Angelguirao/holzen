import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePauseSessionPersistToStorage } from '@/hooks/use-pause-session-persist-to-storage';
import type { PauseSessionPersistSnapshotInput } from '@/features/pause/application/session/persist-snapshot';
import { buildPauseSessionPersistSnapshot } from '@/features/pause/application/session/persist-snapshot';

const { saveSessionMock } = vi.hoisted(() => ({
  saveSessionMock: vi.fn(),
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  saveSession: (...args: unknown[]) => saveSessionMock(...args),
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

function base(over: Partial<PauseSessionPersistSnapshotInput> = {}): PauseSessionPersistSnapshotInput {
  return {
    message: 'hello',
    context: null,
    pauseInstanceId: null,
    companions,
    companionPrefs,
    severity: 'mild',
    moodDone: false,
    moodAfterDone: false,
    selectedMood: null,
    selectedMoodAfter: null,
    feelIntensity: null,
    shiftIntensity: null,
    phase: 'session',
    decision: null,
    step: 'feel',
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    frameDone: false,
    ritualEntry: 'picker',
    briefStep: 'feel',
    briefIntegrateDone: false,
    selectedBriefFace: null,
    ...over,
  };
}

beforeEach(() => {
  saveSessionMock.mockClear();
});

describe('usePauseSessionPersistToStorage', () => {
  it('does not save when there is no instance id and message is empty', () => {
    renderHook(() => usePauseSessionPersistToStorage(base({ message: '', pauseInstanceId: null })));
    expect(saveSessionMock).not.toHaveBeenCalled();
  });

  it('saves when pauseInstanceId is set even if reflection message is empty', () => {
    const input = base({
      message: '',
      pauseInstanceId: 'pause-uuid',
      step: 'breathe',
      moodDone: true,
      ritualEntry: 'deep',
    });
    renderHook(() => usePauseSessionPersistToStorage(input));
    expect(saveSessionMock).toHaveBeenCalledTimes(1);
    expect(saveSessionMock).toHaveBeenCalledWith(buildPauseSessionPersistSnapshot(input));
  });

  it('saves built snapshot when message is set', () => {
    const input = base({ message: 'm', step: 'reflect' });
    renderHook(() => usePauseSessionPersistToStorage(input));
    expect(saveSessionMock).toHaveBeenCalledTimes(1);
    expect(saveSessionMock).toHaveBeenCalledWith(buildPauseSessionPersistSnapshot(input));
  });

  it('saves again when a dependency changes', () => {
    const { rerender } = renderHook(
      (props: PauseSessionPersistSnapshotInput) => usePauseSessionPersistToStorage(props),
      { initialProps: base({ message: 'm', step: 'feel' }) },
    );
    expect(saveSessionMock).toHaveBeenCalledTimes(1);
    rerender(base({ message: 'm', step: 'reflect' }));
    expect(saveSessionMock).toHaveBeenCalledTimes(2);
    expect(saveSessionMock.mock.calls[1][0]).toEqual(buildPauseSessionPersistSnapshot(base({ message: 'm', step: 'reflect' })));
  });
});
