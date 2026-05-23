import { describe, expect, it, vi } from 'vitest';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/step-bundles';
import type {
  PauseSessionStepRitualBundleInput,
  PauseSessionStepShellBundleInput,
} from '@/features/pause/application/use-cases/session/step-bundle-types';

const shellInput = {
  leaveWithPendingOpen: false,
  setLeaveWithPendingOpen: vi.fn(),
  pending: null,
  leaveSheetBusy: false,
  confirmLeavePauseSession: vi.fn(),
  requestExitPauseBeforeDone: vi.fn(),
  handleDeclinePendingFromLeaveSheet: vi.fn(),
  handlePendingAdoptFromLeaveSheet: vi.fn(),
  hasCoalescedShellSession: true,
  hydration: { status: 'empty' as const },
  fetchFailed: false,
  waitingForFetch: false,
  pauseInstanceIdForTerminal: 'inst-1',
  fetchedInstance: null,
  companions: [],
  companionPrefs: {
    breathing: true,
    haiku: true,
    grounding: true,
    signal: true,
    zoomOut: true,
    history: true,
  },
  severity: 'mild' as const,
  context: null,
  pauseInstanceId: 'inst-1',
} satisfies PauseSessionStepShellBundleInput;

const ritualInput = {
  step: 'feel' as const,
  setStep: vi.fn(),
  setRitualEntry: vi.fn(),
  setBriefStep: vi.fn(),
  phase: 'session' as const,
  curtainLifted: false,
  soundMuted: false,
  setSoundMuted: vi.fn(),
  ritualEntry: 'deep' as const,
  decision: null,
  pauseImpactData: null,
  isFavorite: false,
  moodDone: false,
  selectedMood: null,
  selectedBriefFace: null,
  feelIntensity: null,
  briefStep: 'feel' as const,
  briefIntegrateDone: false,
  breathingFirstCompleted: false,
  setBreathingFirstCompleted: vi.fn(),
  breathingSecondCompleted: false,
  setBreathingSecondCompleted: vi.fn(),
  swipeDirection: 'forward' as const,
} satisfies PauseSessionStepRitualBundleInput;

describe('buildPauseSessionStepShellBundle', () => {
  it('overlays handleReturn from session chrome', () => {
    const handleReturn = vi.fn();
    const bundle = buildPauseSessionStepShellBundle(shellInput, { handleReturn });
    expect(bundle.handleReturn).toBe(handleReturn);
    expect(bundle.pauseInstanceId).toBe('inst-1');
    expect(bundle.hydration.status).toBe('empty');
  });
});

describe('buildPauseSessionStepRitualBundle', () => {
  it('passes ritual step and swipe direction through', () => {
    const bundle = buildPauseSessionStepRitualBundle(ritualInput);
    expect(bundle.step).toBe('feel');
    expect(bundle.ritualEntry).toBe('deep');
    expect(bundle.swipeDirection).toBe('forward');
  });
});
