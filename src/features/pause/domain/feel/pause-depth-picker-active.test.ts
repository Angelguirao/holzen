import { describe, expect, it } from 'vitest';
import { isPauseSessionDepthPickerActive } from './pause-depth-picker-active';

describe('isPauseSessionDepthPickerActive', () => {
  it('is true in session on picker with coalesced shell (message or instance id)', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(true);
  });

  it('is false without coalesced shell', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: false,
      }),
    ).toBe(false);
  });

  it('is false when ritual already chosen', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'deep',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });

  it('is false on done phase', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'done',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });
});
