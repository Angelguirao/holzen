import { describe, expect, it } from 'vitest';
import {
  PAUSE_HELP_FEEDBACK_MAX_DEFERRALS,
  PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_DAYS,
  shouldShowPauseHelpFeedback,
} from './pause-help-feedback-eligibility';
import type { PauseHelpFeedbackStorageState } from '@/features/pause/infrastructure/pause-help-feedback-storage';

const baseStorage: PauseHelpFeedbackStorageState = {
  ratedPauseIds: [],
  deferredPauseIds: [],
  deferralCount: 0,
  optedOut: false,
  lastPromptLocalDate: null,
  lastPromptPauseInstanceId: null,
  lastSubmittedAt: null,
};

describe('shouldShowPauseHelpFeedback', () => {
  it('requires user and pause instance', () => {
    expect(
      shouldShowPauseHelpFeedback({ userId: undefined, pauseInstanceId: 'p1', storage: baseStorage }),
    ).toBe(false);
    expect(
      shouldShowPauseHelpFeedback({ userId: 'u1', pauseInstanceId: null, storage: baseStorage }),
    ).toBe(false);
  });

  it('blocks after rating, deferral, or opt-out', () => {
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p1',
        storage: { ...baseStorage, ratedPauseIds: ['p1'] },
      }),
    ).toBe(false);
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p1',
        storage: { ...baseStorage, deferredPauseIds: ['p1'] },
      }),
    ).toBe(false);
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p1',
        storage: { ...baseStorage, optedOut: true },
      }),
    ).toBe(false);
  });

  it('allows at most one prompt per local calendar day', () => {
    const now = new Date('2026-06-07T15:00:00');
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p2',
        now,
        storage: {
          ...baseStorage,
          lastPromptLocalDate: '2026-06-07',
          lastPromptPauseInstanceId: 'p1',
        },
      }),
    ).toBe(false);
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p1',
        now,
        storage: {
          ...baseStorage,
          lastPromptLocalDate: '2026-06-07',
          lastPromptPauseInstanceId: 'p1',
        },
      }),
    ).toBe(true);
  });

  it('blocks re-prompt within 7 days of a successful submit', () => {
    const now = new Date('2026-06-10T12:00:00');
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p2',
        now,
        storage: {
          ...baseStorage,
          lastSubmittedAt: '2026-06-07T12:00:00.000Z',
        },
      }),
    ).toBe(false);
    expect(
      shouldShowPauseHelpFeedback({
        userId: 'u1',
        pauseInstanceId: 'p2',
        now,
        storage: {
          ...baseStorage,
          lastSubmittedAt: '2026-06-03T12:00:00.000Z',
        },
      }),
    ).toBe(true);
  });

  it('documents cap constants', () => {
    expect(PAUSE_HELP_FEEDBACK_MAX_DEFERRALS).toBe(3);
    expect(PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_DAYS).toBe(7);
  });
});
