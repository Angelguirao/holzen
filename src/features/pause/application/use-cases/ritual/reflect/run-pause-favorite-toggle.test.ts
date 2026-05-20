import { describe, expect, it, vi } from 'vitest';
import {
  computeFavoriteToggleNext,
  runPauseFavoriteToggle,
  shouldShowFavoriteProHint,
} from './run-pause-favorite-toggle';

describe('computeFavoriteToggleNext', () => {
  it('flips boolean', () => {
    expect(computeFavoriteToggleNext(false)).toBe(true);
    expect(computeFavoriteToggleNext(true)).toBe(false);
  });
});

describe('shouldShowFavoriteProHint', () => {
  it('shows only when favoriting while not subscribed', () => {
    expect(shouldShowFavoriteProHint(true, false)).toBe(true);
    expect(shouldShowFavoriteProHint(true, true)).toBe(false);
    expect(shouldShowFavoriteProHint(false, false)).toBe(false);
  });
});

describe('runPauseFavoriteToggle', () => {
  it('returns no_instance without RPC', async () => {
    const logStep = vi.fn();
    expect(
      await runPauseFavoriteToggle({ pauseInstanceId: null, isFavorite: false }, { logStep }),
    ).toEqual({ status: 'no_instance' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs favorite_toggled with new value', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runPauseFavoriteToggle(
      { pauseInstanceId: 'inst-1', isFavorite: false },
      { logStep },
    );

    expect(result).toEqual({ status: 'success', newValue: true });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { is_favorite: true },
    });
  });

  it('returns sync_failed on RPC error', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runPauseFavoriteToggle(
      { pauseInstanceId: 'inst-1', isFavorite: true },
      { logStep },
    );

    expect(result).toEqual({ status: 'sync_failed', attemptedValue: false });
  });
});
