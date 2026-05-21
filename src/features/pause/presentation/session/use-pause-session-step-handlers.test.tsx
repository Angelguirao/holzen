import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { usePauseSessionStepHandlers } from './use-pause-session-step-handlers';

const {
  usePauseSessionMoodChromeHandlersMock,
  usePauseSessionBreathReflectHandlersMock,
  buildPauseSessionStepShellBundleMock,
  buildPauseSessionStepRitualBundleMock,
  mockMoodBundle,
  mockBreathBundle,
  mockReflectBundle,
  mockToggleFavorite,
  mockChromeClose,
  mockHandleFrameImDone,
  lastMoodChromeArgs,
  lastBreathReflectArgs,
} = vi.hoisted(() => {
  const mockMoodBundle = { handleMoodSelect: vi.fn(), handleMoodSkip: vi.fn() };
  const mockBreathBundle = { goToStep: vi.fn() };
  const mockReflectBundle = {
    effectiveReflectionMessage: 'copy',
    reflectionLoading: false,
    reflectionError: null,
    retryReflection: vi.fn(),
    handleDecide: vi.fn(),
  };
  const mockToggleFavorite = vi.fn();
  const mockChromeClose = vi.fn();
  const mockHandleFrameImDone = vi.fn();
  const lastMoodChromeArgs: { current: unknown[] | null } = { current: null };
  const lastBreathReflectArgs: { current: unknown[] | null } = { current: null };

  const usePauseSessionMoodChromeHandlersMock = vi.fn((...args: unknown[]) => {
    lastMoodChromeArgs.current = args;
    return {
      mood: mockMoodBundle,
      toggleFavorite: mockToggleFavorite,
      handlePauseSessionChromeClose: mockChromeClose,
    };
  });

  const usePauseSessionBreathReflectHandlersMock = vi.fn((...args: unknown[]) => {
    lastBreathReflectArgs.current = args;
    return {
      breath: mockBreathBundle,
      reflect: mockReflectBundle,
      handleFrameImDone: mockHandleFrameImDone,
    };
  });

  return {
    usePauseSessionMoodChromeHandlersMock,
    usePauseSessionBreathReflectHandlersMock,
    buildPauseSessionStepShellBundleMock: vi.fn((shell, extras) => ({ ...shell, ...extras, bundle: 'shell' })),
    buildPauseSessionStepRitualBundleMock: vi.fn((ritual) => ({ ...ritual, bundle: 'ritual' })),
    mockMoodBundle,
    mockBreathBundle,
    mockReflectBundle,
    mockToggleFavorite,
    mockChromeClose,
    mockHandleFrameImDone,
    lastMoodChromeArgs,
    lastBreathReflectArgs,
  };
});

vi.mock('../reflect/mood/use-pause-session-mood-chrome-handlers', () => ({
  usePauseSessionMoodChromeHandlers: usePauseSessionMoodChromeHandlersMock,
}));

vi.mock('./breath/use-pause-session-breath-reflect-handlers', () => ({
  usePauseSessionBreathReflectHandlers: usePauseSessionBreathReflectHandlersMock,
}));

vi.mock('@/features/pause/application/use-cases/session/step-bundles', () => ({
  buildPauseSessionStepShellBundle: buildPauseSessionStepShellBundleMock,
  buildPauseSessionStepRitualBundle: buildPauseSessionStepRitualBundleMock,
}));

const t = ((key: string) => key) as TFunction;
const handleReturn = vi.fn();

function baseProviders() {
  return {
    t,
    handleReturn,
    subscribed: true,
    requirePro: vi.fn().mockReturnValue(true),
    dismissMessage: vi.fn(),
    btcData: { changePercent: -2 } as import('@/features/market/public').BtcPriceData,
    subLoading: false,
    refreshSubscription: vi.fn(),
  };
}

function shellRitualStub() {
  const shell = { pauseInstanceId: 'pi-step-1', message: 'msg' };
  const ritual = { step: 'feel' as const, phase: 'session' as const };
  return { shell, ritual } as import('./use-pause-session-shell-ritual').PauseSessionShellRitualResult;
}

beforeEach(() => {
  usePauseSessionMoodChromeHandlersMock.mockClear();
  usePauseSessionBreathReflectHandlersMock.mockClear();
  buildPauseSessionStepShellBundleMock.mockClear();
  buildPauseSessionStepRitualBundleMock.mockClear();
  lastMoodChromeArgs.current = null;
  lastBreathReflectArgs.current = null;
});

describe('usePauseSessionStepHandlers', () => {
  it('composes mood chrome then breath+reflect with mood passed through', () => {
    const providers = baseProviders();
    const shellRitual = shellRitualStub();

    const { result } = renderHook(() => usePauseSessionStepHandlers(providers, shellRitual));

    expect(usePauseSessionMoodChromeHandlersMock).toHaveBeenCalledWith(providers, shellRitual);
    expect(usePauseSessionBreathReflectHandlersMock).toHaveBeenCalledWith(
      providers,
      shellRitual,
      mockMoodBundle,
    );

    expect(buildPauseSessionStepShellBundleMock).toHaveBeenCalledWith(shellRitual.shell, {
      handleReturn,
    });
    expect(buildPauseSessionStepRitualBundleMock).toHaveBeenCalledWith(shellRitual.ritual);

    expect(result.current.mood).toBe(mockMoodBundle);
    expect(result.current.breath).toBe(mockBreathBundle);
    expect(result.current.reflect).toBe(mockReflectBundle);
    expect(result.current.toggleFavorite).toBe(mockToggleFavorite);
    expect(result.current.handlePauseSessionChromeClose).toBe(mockChromeClose);
    expect(result.current.handleFrameImDone).toBe(mockHandleFrameImDone);
    expect(result.current.subscribed).toBe(true);
    expect(result.current.shell).toMatchObject({ bundle: 'shell', handleReturn });
    expect(result.current.ritual).toMatchObject({ bundle: 'ritual', step: 'feel' });
  });
});
