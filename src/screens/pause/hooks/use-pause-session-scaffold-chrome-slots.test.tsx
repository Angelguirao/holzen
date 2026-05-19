import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePauseSessionScaffoldChromeSlots } from '@/screens/pause/hooks/use-pause-session-scaffold-chrome-slots';

describe('usePauseSessionScaffoldChromeSlots', () => {
  it('renders brief stepper only for brief ritual', () => {
    const { result, rerender } = renderHook(
      ({ ritualEntry }: { ritualEntry: 'brief' | 'deep' }) =>
        usePauseSessionScaffoldChromeSlots({
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
      usePauseSessionScaffoldChromeSlots({
        phase: 'session',
        ritualEntry: 'deep',
        briefStep: 'feel',
        fetchedInstance: {
          db_state: 'engaged',
          engaged_at: '2026-05-16T12:00:00.000Z',
        } as Parameters<typeof usePauseSessionScaffoldChromeSlots>[0]['fetchedInstance'],
      }),
    );
    expect(result.current.engagedOpenMaxCountdownSlot).toBeTruthy();
  });

  it('omits engaged countdown when phase is done', () => {
    const { result } = renderHook(() =>
      usePauseSessionScaffoldChromeSlots({
        phase: 'done',
        ritualEntry: 'deep',
        briefStep: 'feel',
        fetchedInstance: {
          db_state: 'engaged',
          engaged_at: '2026-05-16T12:00:00.000Z',
        } as Parameters<typeof usePauseSessionScaffoldChromeSlots>[0]['fetchedInstance'],
      }),
    );
    expect(result.current.engagedOpenMaxCountdownSlot).toBeUndefined();
  });
});
