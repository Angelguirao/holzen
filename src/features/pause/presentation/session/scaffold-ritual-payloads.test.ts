import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { buildPauseSessionScaffoldRitualPayloads } from '@/features/pause/public';
import { buildPauseSessionStepTransitionConfig } from '@/features/pause/public';
import type { PauseBreathingHandle } from '@/features/pause/public';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/public';

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
    onFeelTilesSelect: vi.fn(),
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
    prefersReducedMotion: false,
    briefIntegrateDone: false,
    handleBriefIntegrateComplete: vi.fn(),
    handleBriefRepeatBreaths: vi.fn(),
    handleBriefSwitchToDeepPause: vi.fn(),
    handleDecide: vi.fn(),
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
    handleDeepFirstBreathRepeat: vi.fn(),
    handleDeepSecondBreathRepeat: vi.fn(),
    severityAbsPct: 5,
    reflectionLoading: false,
    reflectionError: null,
    onReflectionRetry: vi.fn(),
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

  it('wires deep first breath repeat', () => {
    const handleDeepFirstBreathRepeat = vi.fn();
    const { params } = setup({ handleDeepFirstBreathRepeat });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    deepRitual.onRepeatDeepFirstBreathPattern();
    expect(handleDeepFirstBreathRepeat).toHaveBeenCalled();
  });

  it('wires deep second breath repeat', () => {
    const handleDeepSecondBreathRepeat = vi.fn();
    const { params } = setup({ handleDeepSecondBreathRepeat });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    deepRitual.onRepeatDeepSecondBreathPattern();
    expect(handleDeepSecondBreathRepeat).toHaveBeenCalled();
  });

  it('wires deep frame done', () => {
    const handleFrameImDone = vi.fn();
    const { params } = setup({ handleFrameImDone });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    void deepRitual.onFrameImDone();
    expect(handleFrameImDone).toHaveBeenCalled();
  });

  it('forwards timed breathing changes to setBreathTimedActive for brief and deep', () => {
    const { params, setBreathTimedActive } = setup();
    const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);

    expect(deepRitual.prefersReducedMotion).toBe(false);

    briefRitual.onTimedBreathingChange(true);
    expect(setBreathTimedActive).toHaveBeenLastCalledWith(true);

    deepRitual.onTimedBreathingChange(false);
    expect(setBreathTimedActive).toHaveBeenLastCalledWith(false);
  });

  it('maps prefersReducedMotion onto deep ritual', () => {
    const { params } = setup({ prefersReducedMotion: true });
    const { deepRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    expect(deepRitual.prefersReducedMotion).toBe(true);
  });

  it('wires brief integrate repeat / deep switch and deepPauseLocked from subscription', () => {
    const handleBriefRepeatBreaths = vi.fn();
    const handleBriefSwitchToDeepPause = vi.fn();
    const { params } = setup({
      handleBriefRepeatBreaths,
      handleBriefSwitchToDeepPause,
      subscribed: false,
    });
    const { briefRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    expect(briefRitual.deepPauseLocked).toBe(true);
    briefRitual.onBriefRepeatBreaths();
    expect(handleBriefRepeatBreaths).toHaveBeenCalled();
    briefRitual.onBriefSwitchToDeepPause();
    expect(handleBriefSwitchToDeepPause).toHaveBeenCalled();
  });

  it('brief deepPauseLocked false when subscribed', () => {
    const { params } = setup({ subscribed: true });
    const { briefRitual } = buildPauseSessionScaffoldRitualPayloads(params);
    expect(briefRitual.deepPauseLocked).toBe(false);
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
