import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/feedback/step-sync-toast';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('showPauseStepSyncFailedToast', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
  });

  it('uses pause.stepSyncFailed with fixed duration', () => {
    const t = vi.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key) as unknown as TFunction;
    showPauseStepSyncFailedToast(t);
    expect(t).toHaveBeenCalledWith(
      'pause.stepSyncFailed',
      expect.objectContaining({
        defaultValue: 'Could not sync this step. Check your connection and try again.',
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      'Could not sync this step. Check your connection and try again.',
      { duration: 5000 },
    );
  });
});
