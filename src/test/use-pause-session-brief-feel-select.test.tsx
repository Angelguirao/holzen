import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionBriefFeelSelect } from '@/hooks/use-pause-session-brief-feel-select';

describe('usePauseSessionBriefFeelSelect', () => {
  it('forwards mood, intensity, and brief ritual opts', async () => {
    const handleMoodSelect = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePauseSessionBriefFeelSelect({ handleMoodSelect }));
    await act(async () => {
      result.current.onBriefFeelSelect('calm', 2, 'calm');
    });
    expect(handleMoodSelect).toHaveBeenCalledWith('calm', 2, {
      briefRitual: true,
      briefFace: 'calm',
    });
  });
});
