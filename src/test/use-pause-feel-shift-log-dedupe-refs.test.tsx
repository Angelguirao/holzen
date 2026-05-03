import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseFeelShiftLogDedupeRefs } from '@/hooks/use-pause-feel-shift-log-dedupe-refs';

describe('usePauseFeelShiftLogDedupeRefs', () => {
  it('clears both refs when pauseInstanceId changes', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => usePauseFeelShiftLogDedupeRefs(id),
      { initialProps: { id: 'a' as string | null } },
    );
    act(() => {
      result.current.lastFeelLogKeyRef.current = 'feel-key';
      result.current.lastShiftLogKeyRef.current = 'shift-key';
    });
    expect(result.current.lastFeelLogKeyRef.current).toBe('feel-key');
    rerender({ id: 'b' });
    expect(result.current.lastFeelLogKeyRef.current).toBeNull();
    expect(result.current.lastShiftLogKeyRef.current).toBeNull();
  });

  it('does not clear on first mount when id is null then set (only runs effect per change)', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => usePauseFeelShiftLogDedupeRefs(id),
      { initialProps: { id: null as string | null } },
    );
    act(() => {
      result.current.lastFeelLogKeyRef.current = 'k';
    });
    rerender({ id: 'x' });
    expect(result.current.lastFeelLogKeyRef.current).toBeNull();
  });
});
