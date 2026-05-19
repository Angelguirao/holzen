import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/public';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockT = vi.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key) as unknown as TFunction;

describe('showPauseOutcomeSaveFailedToast', () => {
  beforeEach(() => vi.mocked(toast.error).mockClear());

  it('uses outcomeSaveFailed with 5s duration', () => {
    showPauseOutcomeSaveFailedToast(mockT);
    expect(mockT).toHaveBeenCalledWith(
      'pause.outcomeSaveFailed',
      expect.objectContaining({ defaultValue: 'Could not save your choice. Try again.' }),
    );
    expect(toast.error).toHaveBeenCalledWith('Could not save your choice. Try again.', { duration: 5000 });
  });
});

describe('showPauseOutcomeNotCompletedToast', () => {
  beforeEach(() => vi.mocked(toast.error).mockClear());

  it('uses outcomeNotCompleted with 8s duration', () => {
    showPauseOutcomeNotCompletedToast(mockT);
    expect(mockT).toHaveBeenCalledWith(
      'pause.outcomeNotCompleted',
      expect.objectContaining({
        defaultValue: expect.stringContaining('not complete yet'),
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      'Your choice was saved, but this pause is not complete yet — open Reflect and finish a companion card, then choose again.',
      { duration: 8000 },
    );
  });
});
