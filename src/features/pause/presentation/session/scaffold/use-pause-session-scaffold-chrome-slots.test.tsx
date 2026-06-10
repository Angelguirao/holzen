import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PauseScaffoldChromeRegistry } from './pause-session-scaffold-vm-types';
import {
  usePauseSessionScaffoldChromeSlots,
  type UsePauseSessionScaffoldChromeSlotsParams,
} from './use-pause-session-scaffold-chrome-slots';

const stubRegistry: PauseScaffoldChromeRegistry = {
  renderBriefStepper: () => 'brief-stepper' as unknown as ReactNode,
  renderEngagedOpenMaxCountdown: () => 'engaged-countdown' as unknown as ReactNode,
};

describe('usePauseSessionScaffoldChromeSlots', () => {
  it('renders brief stepper only for brief ritual', () => {
    const { result, rerender } = renderHook(
      ({ ritualEntry }: { ritualEntry: 'brief' | 'deep' }) =>
        usePauseSessionScaffoldChromeSlots(stubRegistry, {
          phase: 'session',
          ritualEntry,
          briefStep: 'feel',
          fetchedInstance: null,
        }),
      { initialProps: { ritualEntry: 'brief' as const } },
    );
    expect(result.current.briefStepperSlot).toBeTruthy();
    rerender({ ritualEntry: 'deep' });
    expect(result.current.briefStepperSlot).toBeUndefined();
  });

  it('renders engaged countdown when instance is engaged in session phase', () => {
    const { result } = renderHook(() =>
      usePauseSessionScaffoldChromeSlots(stubRegistry, {
        phase: 'session',
        ritualEntry: 'deep',
        briefStep: 'feel',
        fetchedInstance: {
          id: 'p1',
          db_state: 'engaged',
          created_at: '2026-05-16T10:00:00.000Z',
          engaged_at: '2026-05-16T12:00:00.000Z',
          source: 'manual',
          metadata: { calm_settled_at: '2026-05-16T12:00:00.000Z' },
        } as UsePauseSessionScaffoldChromeSlotsParams['fetchedInstance'],
      }),
    );
    expect(result.current.engagedOpenMaxCountdownSlot).toBeTruthy();
  });

  it('omits engaged countdown when phase is done', () => {
    const { result } = renderHook(() =>
      usePauseSessionScaffoldChromeSlots(stubRegistry, {
        phase: 'done',
        ritualEntry: 'deep',
        briefStep: 'feel',
        fetchedInstance: {
          id: 'p1',
          db_state: 'engaged',
          created_at: '2026-05-16T10:00:00.000Z',
          engaged_at: '2026-05-16T12:00:00.000Z',
          source: 'manual',
          metadata: { calm_settled_at: '2026-05-16T12:00:00.000Z' },
        } as UsePauseSessionScaffoldChromeSlotsParams['fetchedInstance'],
      }),
    );
    expect(result.current.engagedOpenMaxCountdownSlot).toBeUndefined();
  });
});
