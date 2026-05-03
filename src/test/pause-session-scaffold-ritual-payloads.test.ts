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
  return {
    params,
    setBriefStep,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathTimedActive,
    handleBriefBreathContinue,
  };
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

  it('wires deep ritual breath segments and continue handlers', () => {
    const handleContinueAfterFirstBreath = vi.fn();
    const handleContinueAfterSecondBreath = vi.fn();
    const { params, setBreathingFirstCompleted, setBreathingSecondCompleted } = setup({
      handleContinueAfterFirstBreath,
      handleContinueAfterSecondBreath,
    });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    deepRitual.onFirstBreathPatternComplete();
    expect(setBreathingFirstCompleted).toHaveBeenCalledWith(true);

    void deepRitual.onContinueAfterFirstBreath();
    expect(handleContinueAfterFirstBreath).toHaveBeenCalled();

    deepRitual.onSecondBreathPatternComplete();
    expect(setBreathingSecondCompleted).toHaveBeenCalledWith(true);

    void deepRitual.onContinueAfterSecondBreath();
    expect(handleContinueAfterSecondBreath).toHaveBeenCalled();
  });

  it('wires deep frame done and choose-bridge', () => {
    const handleFrameImDone = vi.fn();
    const handleDeepChooseBridgeContinue = vi.fn();
    const { params } = setup({ handleFrameImDone, handleDeepChooseBridgeContinue });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    void deepRitual.onFrameImDone();
    expect(handleFrameImDone).toHaveBeenCalled();

    deepRitual.onDeepChooseBridgeContinue();
    expect(handleDeepChooseBridgeContinue).toHaveBeenCalled();
  });

  it('forwards timed breathing changes to setBreathTimedActive for brief and deep', () => {
    const { params, setBreathTimedActive } = setup();
    const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    briefRitual.onTimedBreathingChange(true);
    expect(setBreathTimedActive).toHaveBeenLastCalledWith(true);

    deepRitual.onTimedBreathingChange(false);
    expect(setBreathTimedActive).toHaveBeenLastCalledWith(false);
  });

  it('forwards brief and deep skip breath handlers', () => {
    const handleBriefSkipBreath = vi.fn();
    const handleSkipFirstBreath = vi.fn();
    const handleSkipSecondBreath = vi.fn();
    const { params } = setup({ handleBriefSkipBreath, handleSkipFirstBreath, handleSkipSecondBreath });
    const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    briefRitual.onSkipBriefBreath();
    expect(handleBriefSkipBreath).toHaveBeenCalled();

    deepRitual.onSkipFirstBreath();
    expect(handleSkipFirstBreath).toHaveBeenCalled();

    deepRitual.onSkipSecondBreath();
    expect(handleSkipSecondBreath).toHaveBeenCalled();
  });
});
