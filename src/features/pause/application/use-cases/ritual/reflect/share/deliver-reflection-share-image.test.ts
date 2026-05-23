import { describe, expect, it, vi } from 'vitest';
import { deliverReflectionShareImage } from './deliver-reflection-share-image';

describe('deliverReflectionShareImage', () => {
  const blob = new Blob(['png'], { type: 'image/png' });

  it('uses navigator.share when files are shareable', async () => {
    const share = vi.fn(async () => undefined);
    const canShare = vi.fn(() => true);

    await expect(
      deliverReflectionShareImage(blob, { share, canShare }),
    ).resolves.toBe('shared');

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Holzen Reflection',
        files: [expect.any(File)],
      }),
    );
  });

  it('returns aborted when share is cancelled', async () => {
    const share = vi.fn(async () => {
      throw new DOMException('Aborted', 'AbortError');
    });
    const canShare = vi.fn(() => true);

    await expect(
      deliverReflectionShareImage(blob, { share, canShare }),
    ).resolves.toBe('aborted');
  });

  it('downloads when share is unavailable', async () => {
    const click = vi.fn();
    const createDownloadAnchor = vi.fn(
      () => ({ href: '', download: '', click }) as unknown as HTMLAnchorElement,
    );
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();

    await expect(
      deliverReflectionShareImage(blob, {
        share: undefined,
        canShare: undefined,
        createDownloadAnchor,
        createObjectURL,
        revokeObjectURL,
      }),
    ).resolves.toBe('downloaded');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
