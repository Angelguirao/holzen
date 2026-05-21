import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { usePauseSessionBreathReflectHandlers } from './use-pause-session-breath-reflect-handlers';

const {
  usePauseSessionBreathHandlersMock,
  usePauseSessionReflectAndDecideMock,
  usePauseShiftFrameDoneHandlerMock,
  goToStepMock,
  handleFrameImDoneMock,
  handleDecideMock,
  lastBreathArgs,
  lastReflectArgs,
  lastShiftFrameArgs,
} = vi.hoisted(() => {
  const lastBreathArgs: { current: Record<string, unknown> | null } = { current: null };
  const lastReflectArgs: { current: Record<string, unknown> | null } = { current: null };
  const lastShiftFrameArgs: { current: Record<string, unknown> | null } = { current: null };
  const goToStepMock = vi.fn();
  const handleFrameImDoneMock = vi.fn();
  const handleDecideMock = vi.fn(async () => undefined);
  const usePauseSessionBreathHandlersMock = vi.fn((args: Record<string, unknown>) => {
    lastBreathArgs.current = args;
    return { goToStep: goToStepMock };
  });
  const usePauseSessionReflectAndDecideMock = vi.fn((args: Record<string, unknown>) => {
    lastReflectArgs.current = args;
    return {
      effectiveReflectionMessage: 'Effective copy',
      reflectionLoading: false,
      reflectionError: null,
      retryReflection: vi.fn(),
      handleDecide: handleDecideMock,
    };
  });
  const usePauseShiftFrameDoneHandlerMock = vi.fn((args: Record<string, unknown>) => {
    lastShiftFrameArgs.current = args;
    return { handleFrameImDone: handleFrameImDoneMock };
  });
  return {
    usePauseSessionBreathHandlersMock,
    usePauseSessionReflectAndDecideMock,
    usePauseShiftFrameDoneHandlerMock,
    goToStepMock,
    handleFrameImDoneMock,
    handleDecideMock,
    lastBreathArgs,
    lastReflectArgs,
    lastShiftFrameArgs,
  };
});

vi.mock('./use-pause-session-breath-handlers', () => ({
  usePauseSessionBreathHandlers: usePauseSessionBreathHandlersMock,
}));

vi.mock('../../reflect/flows/use-pause-session-reflect-and-decide', () => ({
  usePauseSessionReflectAndDecide: usePauseSessionReflectAndDecideMock,
}));

vi.mock('../../reflect/hub/use-pause-shift-frame-done-handler', () => ({
  usePauseShiftFrameDoneHandler: usePauseShiftFrameDoneHandlerMock,
}));

const t = ((key: string) => key) as TFunction;

function baseProviders() {
  return {
    t,
    dismissMessage: vi.fn(),
    btcData: { changePercent: -3.1 } as import('@/features/market/public').BtcPriceData,
    subscribed: true,
    subLoading: false,
    requirePro: vi.fn(),
    refreshSubscription: vi.fn(),
  };
}

function baseShell() {
  return {
    restored: null,
    message: 'Opening message',
    context: 'btc_dip',
    pauseInstanceId: 'pause-inst-1',
    companions: { haiku: 'haiku line' } as import('@/features/pause/domain/companion-card-types').CompanionData,
  };
}

function baseRitual() {
  return {
    step: 'frame' as const,
    phase: 'session' as const,
    ritualEntry: 'deep' as const,
    briefStep: 'feel' as const,
    breathingFirstCompleted: true,
    breathingSecondCompleted: false,
    selectedMood: 'calm' as const,
    selectedMoodAfter: null,
    feelIntensity: 2,
    shiftIntensity: 4,
    setSwipeDirection: vi.fn(),
    setStep: vi.fn(),
    setBriefStep: vi.fn(),
    setBriefIntegrateDone: vi.fn(),
    setBreathingFirstCompleted: vi.fn(),
    setBreathingSecondCompleted: vi.fn(),
    setRitualEntry: vi.fn(),
    setFrameDone: vi.fn(),
    setMoodAfterDone: vi.fn(),
    setDecision: vi.fn(),
    setPauseImpactData: vi.fn(),
    setPhase: vi.fn(),
  };
}

function baseMood() {
  const lastShiftLogKeyRef: MutableRefObject<string | null> = { current: null };
  return { lastShiftLogKeyRef };
}

beforeEach(() => {
  usePauseSessionBreathHandlersMock.mockClear();
  usePauseSessionReflectAndDecideMock.mockClear();
  usePauseShiftFrameDoneHandlerMock.mockClear();
  goToStepMock.mockClear();
  handleFrameImDoneMock.mockClear();
  handleDecideMock.mockClear();
  lastBreathArgs.current = null;
  lastReflectArgs.current = null;
  lastShiftFrameArgs.current = null;
});

describe('usePauseSessionBreathReflectHandlers', () => {
  it('wires breath handlers with shell and ritual session state', () => {
    const providers = baseProviders();
    const shell = baseShell();
    const ritual = baseRitual();

    renderHook(() =>
      usePauseSessionBreathReflectHandlers(providers, { shell, ritual }, baseMood()),
    );

    expect(lastBreathArgs.current).toMatchObject({
      pauseInstanceId: 'pause-inst-1',
      restored: null,
      ritualEntry: 'deep',
      step: 'frame',
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
      subscribed: true,
      subLoading: false,
    });
  });

  it('wires shift frame done with mood dedupe ref and breath goToStep', () => {
    const mood = baseMood();
    const ritual = baseRitual();

    renderHook(() =>
      usePauseSessionBreathReflectHandlers(
        baseProviders(),
        { shell: baseShell(), ritual },
        mood,
      ),
    );

    expect(lastShiftFrameArgs.current).toMatchObject({
      pauseInstanceId: 'pause-inst-1',
      lastShiftLogKeyRef: mood.lastShiftLogKeyRef,
      goToStep: goToStepMock,
    });
    expect(lastShiftFrameArgs.current?.setFrameDone).toBe(ritual.setFrameDone);
    expect(lastShiftFrameArgs.current?.setMoodAfterDone).toBe(ritual.setMoodAfterDone);
  });

  it('wires reflect+decide with companions haiku and ritual mood context', () => {
    const providers = baseProviders();
    const shell = baseShell();
    const ritual = baseRitual();

    renderHook(() =>
      usePauseSessionBreathReflectHandlers(providers, { shell, ritual }, baseMood()),
    );

    expect(lastReflectArgs.current).toMatchObject({
      pauseInstanceId: 'pause-inst-1',
      context: 'btc_dip',
      message: 'Opening message',
      ritualEntry: 'deep',
      step: 'frame',
      companionsHaiku: 'haiku line',
      selectedMood: 'calm',
      feelIntensity: 2,
      shiftIntensity: 4,
      dismissMessage: providers.dismissMessage,
      refreshSubscription: providers.refreshSubscription,
    });
  });

  it('exposes composed breath, reflect, and frame-done handlers', async () => {
    const { result } = renderHook(() =>
      usePauseSessionBreathReflectHandlers(
        baseProviders(),
        { shell: baseShell(), ritual: baseRitual() },
        baseMood(),
      ),
    );

    expect(result.current.breath.goToStep).toBe(goToStepMock);
    expect(result.current.reflect.effectiveReflectionMessage).toBe('Effective copy');
    expect(result.current.handleFrameImDone).toBe(handleFrameImDoneMock);

    await act(async () => {
      await result.current.reflect.handleDecide('hold');
    });
    expect(handleDecideMock).toHaveBeenCalledWith('hold');
  });
});
