import { describe, expect, it, vi } from 'vitest';
import { runReflectionShareImage } from './run-reflection-share-image';

vi.mock('@/features/pause/domain/reflect/share/reflection-share-canvas', () => ({
  generateReflectionShareImage: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));

describe('runReflectionShareImage', () => {
  it('renders then delivers the share image', async () => {
    const share = vi.fn(async () => undefined);
    const canShare = vi.fn(() => true);

    await expect(
      runReflectionShareImage('Stay calm.', null, null, { share, canShare }),
    ).resolves.toBe('shared');

    expect(share).toHaveBeenCalled();
  });
});
