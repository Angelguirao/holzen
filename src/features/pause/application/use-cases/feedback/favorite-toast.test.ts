import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { showPauseFavoriteProHintToast } from './favorite-toast';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('showPauseFavoriteProHintToast', () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
  });

  it('shows favorite pro hint for 4s', () => {
    const t = vi.fn(() => 'hint text') as unknown as TFunction;
    showPauseFavoriteProHintToast(t);
    expect(t).toHaveBeenCalledWith('pause.favoriteProHint');
    expect(toast).toHaveBeenCalledWith('hint text', { duration: 4000 });
  });
});
