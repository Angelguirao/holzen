import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { dismissOpenPauseHome } from './dismiss-open-pause-home';

describe('dismissOpenPauseHome', () => {
  it('clears preview without RPC when signed out', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn();
    const repository = { dismissCurrent } as unknown as PauseRepository;
    await dismissOpenPauseHome(false, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(dismissCurrent).not.toHaveBeenCalled();
  });

  it('clears preview then calls dismiss RPC when signed in', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn().mockResolvedValue({ state: 'dismissed' });
    const repository = { dismissCurrent } as unknown as PauseRepository;
    await dismissOpenPauseHome(true, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(dismissCurrent).toHaveBeenCalledOnce();
  });

  it('keeps preview cleared when RPC fails', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { dismissCurrent } as unknown as PauseRepository;
    await dismissOpenPauseHome(true, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
  });
});
