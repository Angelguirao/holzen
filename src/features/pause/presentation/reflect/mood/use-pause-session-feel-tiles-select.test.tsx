import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));
import { renderHook, act } from '@testing-library/react';

vi.mock('./pause-reflect-mood-io', async () => {
  const { buildFeelTilesMoodLogOptions } = await import(
    '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options'
  );
  return { buildFeelTilesMoodLogOptions };
});

import { usePauseSessionFeelTilesSelect } from './use-pause-session-feel-tiles-select';

describe('usePauseSessionFeelTilesSelect', () => {
  it('brief: forwards mood, intensity, brief ritual + face tile', async () => {
    const handleMoodSelect = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePauseSessionFeelTilesSelect({ handleMoodSelect, isBriefRitual: true }),
    );
    await act(async () => {
      result.current.onFeelTilesSelect('calm', 2, 'calm');
    });
    expect(handleMoodSelect).toHaveBeenCalledWith('calm', 2, {
      briefRitual: true,
      briefFace: 'calm',
    });
  });

  it('deep: forwards mood, intensity, and face tile without brief_ritual flag', async () => {
    const handleMoodSelect = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePauseSessionFeelTilesSelect({ handleMoodSelect, isBriefRitual: false }),
    );
    await act(async () => {
      result.current.onFeelTilesSelect('anxious', 4, 'anxious');
    });
    expect(handleMoodSelect).toHaveBeenCalledWith('anxious', 4, { briefFace: 'anxious' });
  });
});
