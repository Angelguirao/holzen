import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { buildPauseSessionScaffoldRitualPayloads } from '@/lib/pause-session-scaffold-ritual-payloads';
import { buildPauseSessionStepTransitionConfig } from '@/lib/pause-session-step-transition';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';
import type { PauseBreathingHandle } from '@/components/pause/PauseBreathing';

function transition() {
  return buildPauseSessionStepTransitionConfig({ swipeDirection: 'forward', prefersReducedMotion: true });
}

function setup(overrides: Partial<Parameters<typeof buildPauseSessionScaffoldRitualPayloads>[0]> = {}) {
  const setBriefStep = vi.fn();
  const setBreathingFirstCompleted = vi.fn();
  const setBreathingSecondCompleted = vi.fn();
  const setBreathTimedActive = vi.fn();
  const handleBriefBreathContinue = vi.fn();
  const breathingRef = createRef<PauseBreathingHandle>();

  const params = {
    briefStep: 'feel' as const,
    step: 'feel' as const,
    stepTransition: transition(),
    moodDone: false,
    selectedMood: null,
    selectedBriefFace: null,
    feelIntensity: null,
    onBriefFeelSelect: vi.fn(),
    setBriefStep,
    breathingRef,
    mantra: null,
    severity: 'mild' as const,
    breathingFirstCompleted: false,
    breathingSecondCompleted: false,
    setBreathTimedActive,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    handleBriefBreathContinue,
    handleBriefSkipBreath: vi.fn(),
    soundMuted: false,
    briefIntegrateDone: false,
    handleBriefIntegrateComplete: vi.fn(),
    handleDecide: vi.fn(),
    briefDecideIntroKicker: 'Step 4',
    handleMoodSelect: vi.fn(),
    handleMoodSkip: vi.fn(),
    handleMoodReset: vi.fn(),
    goToStep: vi.fn(),
    handleContinueAfterFirstBreath: vi.fn(),
    handleContinueAfterSecondBreath: vi.fn(),
    handleSkipFirstBreath: vi.fn(),
    handleSkipSecondBreath: vi.fn(),
    companions: DEFAULT_COMPANIONS,
    companionPrefs: DEFAULT_PREFS,
    pauseInstanceId: 'p1',
    context: null,
    message: 'hello',
    isFavorite: false,
    toggleFavorite: vi.fn(),
    subscribed: false,
    handleFrameImDone: vi.fn(),
    handleDeepChooseBridgeContinue: vi.fn(),
    decideOnBackStep: 'choose' as const,
    ...overrides,
  };
  return { params, setBriefStep, setBreathingFirstCompleted, handleBriefBreathContinue };
}

describe('buildPauseSessionScaffoldRitualPayloads', () => {
  it('wires brief ritual callbacks to setters and handlers', () => {
    const { params, setBriefStep, setBreathingFirstCompleted, handleBriefBreathContinue } = setup();
    const { briefRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    expect(briefRitual.briefStep).toBe('feel');
    briefRitual.onBriefFeelContinueToBreath();
    expect(setBriefStep).toHaveBeenCalledWith('breath');

    briefRitual.onBriefDecideBack();
    expect(setBriefStep).toHaveBeenCalledWith('integrate');

    briefRitual.onBriefBreathPatternComplete();
    expect(setBreathingFirstCompleted).toHaveBeenCalledWith(true);

    void briefRitual.onContinueAfterBriefBreath();
    expect(handleBriefBreathContinue).toHaveBeenCalled();
  });

  it('passes coalesced shell message as deep reflectionMessage', () => {
    const { params } = setup({ message: 'reflect here' });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    expect(deepRitual.reflectionMessage).toBe('reflect here');
  });
});
