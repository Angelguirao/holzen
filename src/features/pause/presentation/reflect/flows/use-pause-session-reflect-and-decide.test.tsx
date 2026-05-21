import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import { usePauseSessionReflectAndDecide } from './use-pause-session-reflect-and-decide';

const {
  usePauseReflectGenerationMock,
  usePauseSessionDecideHandlerMock,
  handleDecideMock,
  lastReflectGenArgs,
  lastDecideHandlerArgs,
} = vi.hoisted(() => {
  const lastReflectGenArgs: { current: Record<string, unknown> | null } = { current: null };
  const lastDecideHandlerArgs: { current: Record<string, unknown> | null } = { current: null };
  const handleDecideMock = vi.fn(async () => undefined);
  const usePauseReflectGenerationMock = vi.fn((args: Record<string, unknown>) => {
    lastReflectGenArgs.current = args;
    return {
      reflectionMessage: 'Generated reflection',
      loading: false,
      error: null,
      retry: vi.fn(),
    };
  });
  const usePauseSessionDecideHandlerMock = vi.fn((args: Record<string, unknown>) => {
    lastDecideHandlerArgs.current = args;
    return { handleDecide: handleDecideMock };
  });
  return {
    usePauseReflectGenerationMock,
    usePauseSessionDecideHandlerMock,
    handleDecideMock,
    lastReflectGenArgs,
    lastDecideHandlerArgs,
  };
});

vi.mock('../generation/use-pause-reflect-generation', () => ({
  usePauseReflectGeneration: usePauseReflectGenerationMock,
}));

vi.mock('./use-pause-session-decide-handler', () => ({
  usePauseSessionDecideHandler: usePauseSessionDecideHandlerMock,
}));

vi.mock('@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow', async () => {
  const flow = await import(
    '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow'
  );
  return {
    resolvePauseSessionReflectAndDecideAfterGeneration:
      flow.resolvePauseSessionReflectAndDecideAfterGeneration,
    resolvePauseSessionReflectAndDecidePreflight:
      flow.resolvePauseSessionReflectAndDecidePreflight,
  };
});

const t = ((key: string) => key) as TFunction;

function baseParams(
  overrides: Partial<Parameters<typeof usePauseSessionReflectAndDecide>[0]> = {},
) {
  return {
    t,
    ritualEntry: 'deep' as const,
    step: 'reflect' as const,
    pauseInstanceId: 'pause-inst-1',
    context: 'btc_dip',
    message: 'Seed message',
    btcData: { changePercent: -4.2 } as import('@/features/market/public').BtcPriceData,
    companionsHaiku: 'line one',
    dismissMessage: vi.fn(),
    refreshSubscription: vi.fn(),
    setDecision: vi.fn(),
    setPauseImpactData: vi.fn(),
    setPhase: vi.fn(),
    selectedMood: 'calm' as const,
    selectedMoodAfter: null,
    breathingFirstCompleted: true,
    breathingSecondCompleted: false,
    feelIntensity: 3,
    shiftIntensity: null,
    ...overrides,
  };
}

beforeEach(() => {
  usePauseReflectGenerationMock.mockClear();
  usePauseSessionDecideHandlerMock.mockClear();
  handleDecideMock.mockClear();
  lastReflectGenArgs.current = null;
  lastDecideHandlerArgs.current = null;
});

describe('usePauseSessionReflectAndDecide', () => {
  it('wires holzen-reflect generation for deep ritual on reflect step', () => {
    renderHook(() => usePauseSessionReflectAndDecide(baseParams()));

    expect(usePauseReflectGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pauseInstanceId: 'pause-inst-1',
        context: 'btc_dip',
        initialReflectionMessage: 'Seed message',
        enabled: true,
      }),
    );
    expect(lastReflectGenArgs.current?.severityAbsPct).toBeTypeOf('number');
  });

  it('disables holzen-reflect for brief ritual on reflect step', () => {
    renderHook(() =>
      usePauseSessionReflectAndDecide(
        baseParams({ ritualEntry: 'brief', step: 'reflect' }),
      ),
    );

    expect(lastReflectGenArgs.current?.enabled).toBe(false);
  });

  it('passes effective generated reflection into decide handler', () => {
    const { result } = renderHook(() => usePauseSessionReflectAndDecide(baseParams()));

    expect(result.current.effectiveReflectionMessage).toBe('Generated reflection');
    expect(lastDecideHandlerArgs.current).toMatchObject({
      pauseInstanceId: 'pause-inst-1',
      reflectionMessage: 'Generated reflection',
      haiku: 'line one',
      ritualEntry: 'deep',
    });
  });

  it('falls back to seed message when generated copy is empty', () => {
    usePauseReflectGenerationMock.mockReturnValueOnce({
      reflectionMessage: '   ',
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { result } = renderHook(() => usePauseSessionReflectAndDecide(baseParams()));

    expect(result.current.effectiveReflectionMessage).toBe('Seed message');
    expect(lastDecideHandlerArgs.current?.reflectionMessage).toBe('Seed message');
  });

  it('exposes decide handler from session decide conductor', async () => {
    const { result } = renderHook(() => usePauseSessionReflectAndDecide(baseParams()));

    await act(async () => {
      await result.current.handleDecide('hold');
    });

    expect(handleDecideMock).toHaveBeenCalledWith('hold');
  });
});
