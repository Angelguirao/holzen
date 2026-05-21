import { describe, expect, it, vi } from 'vitest';
import { dismissOpenPauseHome } from './dismiss-open-pause-home';

describe('dismissOpenPauseHome', () => {
  it('clears preview without RPC when signed out', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn();
    await dismissOpenPauseHome(false, { clearPreview, dismissCurrent });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(dismissCurrent).not.toHaveBeenCalled();
  });

  it('clears preview then calls dismiss RPC when signed in', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn().mockResolvedValue({ state: 'dismissed' });
    await dismissOpenPauseHome(true, { clearPreview, dismissCurrent });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(dismissCurrent).toHaveBeenCalledOnce();
  });

  it('keeps preview cleared when RPC fails', async () => {
    const clearPreview = vi.fn();
    const dismissCurrent = vi.fn().mockRejectedValue(new Error('network'));
    await dismissOpenPauseHome(true, { clearPreview, dismissCurrent });
    expect(clearPreview).toHaveBeenCalledOnce();
  });
});
